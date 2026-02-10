'use client';

import { useERPStore } from '@/store';
import {
  getWorkOrderRepository,
  getProcessStepRepository,
  getProjectRepository,
} from '@/infrastructure/di/container';
import { ProgressWorkOrderUseCase } from '@/domain/production/use-cases/progress-work-order';

export function useWorkOrders() {
  const workOrders = useERPStore((s) => s.workOrders);
  const addToCache = useERPStore((s) => s.addWorkOrderToCache);
  const updateInCache = useERPStore((s) => s.updateWorkOrderInCache);
  const updateStepInCache = useERPStore((s) => s.updateProcessStepInCache);
  const updateProjectInCache = useERPStore((s) => s.updateProjectInCache);

  const repo = getWorkOrderRepository();
  const stepRepo = getProcessStepRepository();
  const projectRepo = getProjectRepository();
  const progressWorkOrderUseCase = new ProgressWorkOrderUseCase(repo, stepRepo, projectRepo);

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
    const result = await progressWorkOrderUseCase.execute({ workOrderId: id, action: 'START' });
    if (!result.ok) throw result.error;

    updateInCache(id, result.value.workOrder);
    if (result.value.updatedStep) {
      updateStepInCache(result.value.updatedStep.id, result.value.updatedStep);
    }
    if (result.value.updatedProject) {
      updateProjectInCache(result.value.updatedProject.id, result.value.updatedProject);
    }
    return result.value.workOrder;
  };

  const completeWorkOrder = async (id: string) => {
    const result = await progressWorkOrderUseCase.execute({ workOrderId: id, action: 'COMPLETE' });
    if (!result.ok) throw result.error;

    updateInCache(id, result.value.workOrder);
    if (result.value.updatedStep) {
      updateStepInCache(result.value.updatedStep.id, result.value.updatedStep);
    }
    if (result.value.updatedProject) {
      updateProjectInCache(result.value.updatedProject.id, result.value.updatedProject);
    }
    return result.value.workOrder;
  };

  return {
    workOrders,
    addWorkOrder,
    updateWorkOrder,
    startWorkOrder,
    completeWorkOrder,
  };
}
