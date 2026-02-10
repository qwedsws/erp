'use client';

import { useERPStore } from '@/store';
import {
  getWorkOrderRepository,
  getProcessStepRepository,
  getProjectRepository,
} from '@/infrastructure/di/container';
import { resolveProjectStatusFromSteps, isStatusLater } from '@/domain/production/services';
import type { ProcessStepStatus } from '@/domain/shared/entities';

export function useWorkOrders() {
  const workOrders = useERPStore((s) => s.workOrders);
  const addToCache = useERPStore((s) => s.addWorkOrderToCache);
  const updateInCache = useERPStore((s) => s.updateWorkOrderInCache);
  const updateStepInCache = useERPStore((s) => s.updateProcessStepInCache);
  const updateProjectInCache = useERPStore((s) => s.updateProjectInCache);
  const projects = useERPStore((s) => s.projects);

  const repo = getWorkOrderRepository();
  const stepRepo = getProcessStepRepository();
  const projectRepo = getProjectRepository();

  /**
   * After a WO status change, sync the linked ProcessStep and potentially
   * advance the Project status. Failures here are non-blocking — the primary
   * WO update has already succeeded.
   */
  const syncStepAndProject = async (
    workOrderId: string,
    projectId: string,
    processStepId: string | undefined,
    newStepStatus: ProcessStepStatus,
  ) => {
    try {
      // 1. Update the linked ProcessStep
      if (!processStepId) return;

      const updatedStep = await stepRepo.update(processStepId, {
        status: newStepStatus,
        ...(newStepStatus === 'IN_PROGRESS'
          ? { start_date: new Date().toISOString().split('T')[0] }
          : { end_date: new Date().toISOString().split('T')[0] }),
      });
      updateStepInCache(processStepId, updatedStep);

      // 2. Only check project advancement when a step is completed
      if (newStepStatus !== 'COMPLETED') return;

      const allSteps = await stepRepo.findByProjectId(projectId);
      const resolvedStatus = resolveProjectStatusFromSteps(allSteps);
      if (!resolvedStatus) return;

      // Only advance forward — never regress project status
      const currentProject = projects.find((p) => p.id === projectId);
      if (!currentProject) return;
      if (!isStatusLater(currentProject.status, resolvedStatus)) return;

      const updatedProject = await projectRepo.update(projectId, {
        status: resolvedStatus,
      });
      updateProjectInCache(projectId, updatedProject);
    } catch (err) {
      // Non-blocking: log but don't throw — the WO update already succeeded
      console.error('[useWorkOrders] syncStepAndProject failed:', err);
    }
  };

  const addWorkOrder = async (data: Parameters<typeof repo.create>[0]) => {
    const wo = await repo.create(data);
    addToCache(wo);
    return wo;
  };

  const updateWorkOrder = async (id: string, data: Parameters<typeof repo.update>[1]) => {
    const updated = await repo.update(id, data);
    updateInCache(id, updated);
    return updated;
  };

  const startWorkOrder = async (id: string) => {
    const updated = await updateWorkOrder(id, {
      status: 'IN_PROGRESS',
      actual_start: new Date().toISOString(),
    });
    await syncStepAndProject(id, updated.project_id, updated.process_step_id, 'IN_PROGRESS');
    return updated;
  };

  const completeWorkOrder = async (id: string) => {
    const updated = await updateWorkOrder(id, {
      status: 'COMPLETED',
      actual_end: new Date().toISOString(),
    });
    await syncStepAndProject(id, updated.project_id, updated.process_step_id, 'COMPLETED');
    return updated;
  };

  return {
    workOrders,
    addWorkOrder,
    updateWorkOrder,
    startWorkOrder,
    completeWorkOrder,
  };
}
