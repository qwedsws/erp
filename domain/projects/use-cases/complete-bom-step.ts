import type { ProcessStep, Project } from '../entities';
import type { IProcessStepRepository, IProjectRepository } from '../ports';
import type { PurchaseRequest } from '../../procurement/entities';
import type { IPurchaseRequestRepository } from '../../procurement/ports';
import {
  CreatePurchaseRequestsFromBomUseCase,
  type BomItem,
} from '../../procurement/use-cases/create-purchase-requests-from-bom';
import { ProgressDesignStepUseCase } from './progress-design-step';
import { type Result, success, failure } from '@/domain/shared/types';

export interface CompleteBomStepInput {
  projectId: string;
  stepId: string;
  assigneeId?: string;
  bomItems: BomItem[];
}

export interface CompleteBomStepResult {
  updatedStep: ProcessStep;
  activatedNextStep: ProcessStep | null;
  updatedProject: Project | null;
  createdPurchaseRequests: PurchaseRequest[];
}

export class CompleteBomStepUseCase {
  private readonly progressDesignStepUseCase: ProgressDesignStepUseCase;
  private readonly createPRsFromBomUseCase: CreatePurchaseRequestsFromBomUseCase;

  constructor(
    private readonly processStepRepo: IProcessStepRepository,
    projectRepo: IProjectRepository,
    prRepo: IPurchaseRequestRepository,
  ) {
    this.progressDesignStepUseCase = new ProgressDesignStepUseCase(
      processStepRepo,
      projectRepo,
    );
    this.createPRsFromBomUseCase = new CreatePurchaseRequestsFromBomUseCase(prRepo);
  }

  async execute(input: CompleteBomStepInput): Promise<Result<CompleteBomStepResult>> {
    const designResult = await this.progressDesignStepUseCase.execute({
      projectId: input.projectId,
      stepId: input.stepId,
      action: 'COMPLETE',
    });
    if (!designResult.ok) {
      return failure(designResult.error);
    }

    const updatedStep = await this.processStepRepo.update(input.stepId, {
      outputs: { ...designResult.value.updatedStep.outputs, bom: input.bomItems },
    });

    const prResult = await this.createPRsFromBomUseCase.execute({
      projectId: input.projectId,
      bomItems: input.bomItems,
      requestedBy: input.assigneeId ?? 'SYSTEM',
    });
    if (!prResult.ok) {
      return failure(prResult.error);
    }

    return success({
      updatedStep,
      activatedNextStep: designResult.value.activatedNextStep,
      updatedProject: designResult.value.updatedProject,
      createdPurchaseRequests: prResult.value.purchaseRequests,
    });
  }
}
