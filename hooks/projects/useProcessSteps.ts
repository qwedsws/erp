'use client';

import { useERPStore } from '@/store';
import {
  getProcessStepRepository,
  getProjectRepository,
  getPurchaseRequestRepository,
} from '@/infrastructure/di/container';
import { ProgressDesignStepUseCase } from '@/domain/projects/use-cases/progress-design-step';
import {
  CreatePurchaseRequestsFromBomUseCase,
  type BomItem,
} from '@/domain/procurement/use-cases/create-purchase-requests-from-bom';

export function useProcessSteps() {
  const processSteps = useERPStore((s) => s.processSteps);
  const addToCache = useERPStore((s) => s.addProcessStepToCache);
  const updateInCache = useERPStore((s) => s.updateProcessStepInCache);
  const removeFromCache = useERPStore((s) => s.removeProcessStepFromCache);
  const updateProjectInCache = useERPStore((s) => s.updateProjectInCache);
  const addPurchaseRequestToCache = useERPStore((s) => s.addPurchaseRequestToCache);

  const processStepRepo = getProcessStepRepository();
  const projectRepo = getProjectRepository();
  const prRepo = getPurchaseRequestRepository();
  const progressDesignStepUseCase = new ProgressDesignStepUseCase(
    processStepRepo,
    projectRepo,
  );
  const createPRsFromBomUseCase = new CreatePurchaseRequestsFromBomUseCase(prRepo);

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

  const completeBomStep = async (stepId: string, bomItems: BomItem[]) => {
    // 1. Find the step to get the project_id
    const step = processSteps.find((s) => s.id === stepId);
    if (!step) throw new Error(`ProcessStep not found: ${stepId}`);

    // 2. Complete the DESIGN_BOM step via progressDesignStep (sets status + activates next)
    const designResult = await progressDesignStep(step.project_id, stepId, 'COMPLETE');

    // 3. Update the step outputs with BOM data
    await processStepRepo.update(stepId, {
      outputs: { ...designResult.updatedStep.outputs, bom: bomItems },
    });
    updateInCache(stepId, {
      outputs: { ...designResult.updatedStep.outputs, bom: bomItems },
    });

    // 4. Create purchase requests from BOM items
    const prResult = await createPRsFromBomUseCase.execute({
      projectId: step.project_id,
      bomItems,
      requestedBy: step.assignee_id ?? 'SYSTEM',
    });

    if (!prResult.ok) throw prResult.error;

    // 5. Update PR cache
    for (const pr of prResult.value.purchaseRequests) {
      addPurchaseRequestToCache(pr);
    }

    return {
      ...designResult,
      createdPurchaseRequests: prResult.value.purchaseRequests,
    };
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
    completeBomStep,
    deleteProcessStep,
  };
}
