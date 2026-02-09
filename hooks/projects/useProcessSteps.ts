'use client';

import { useERPStore } from '@/store';
import { getProcessStepRepository, getProjectRepository } from '@/infrastructure/di/container';
import { ProgressDesignStepUseCase } from '@/domain/projects/use-cases/progress-design-step';

export function useProcessSteps() {
  const processSteps = useERPStore((s) => s.processSteps);
  const addToCache = useERPStore((s) => s.addProcessStepToCache);
  const updateInCache = useERPStore((s) => s.updateProcessStepInCache);
  const removeFromCache = useERPStore((s) => s.removeProcessStepFromCache);
  const updateProjectInCache = useERPStore((s) => s.updateProjectInCache);

  const processStepRepo = getProcessStepRepository();
  const projectRepo = getProjectRepository();
  const progressDesignStepUseCase = new ProgressDesignStepUseCase(
    processStepRepo,
    projectRepo,
  );

  const addProcessStep = async (data: Parameters<typeof processStepRepo.create>[0]) => {
    const step = await processStepRepo.create(data);
    addToCache(step);
    return step;
  };

  const updateProcessStep = async (id: string, data: Parameters<typeof processStepRepo.update>[1]) => {
    const updated = await processStepRepo.update(id, data);
    updateInCache(id, updated);
    return updated;
  };

  const assignProcessSteps = async (stepIds: string[], assigneeId?: string) => {
    const uniqueStepIds = [...new Set(stepIds)];
    await Promise.all(
      uniqueStepIds.map((stepId) =>
        updateProcessStep(stepId, { assignee_id: assigneeId }),
      ),
    );
  };

  const progressDesignStep = async (
    projectId: string,
    stepId: string,
    action: 'START' | 'COMPLETE',
  ) => {
    const result = await progressDesignStepUseCase.execute({ projectId, stepId, action });
    if (!result.ok) throw result.error;

    updateInCache(stepId, result.value.updatedStep);
    if (result.value.activatedNextStep) {
      updateInCache(result.value.activatedNextStep.id, result.value.activatedNextStep);
    }
    if (result.value.updatedProject) {
      updateProjectInCache(result.value.updatedProject.id, result.value.updatedProject);
    }

    return result.value;
  };

  const deleteProcessStep = async (id: string) => {
    await processStepRepo.delete(id);
    removeFromCache(id);
  };

  return {
    processSteps,
    addProcessStep,
    updateProcessStep,
    assignProcessSteps,
    progressDesignStep,
    deleteProcessStep,
  };
}
