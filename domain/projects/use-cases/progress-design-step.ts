import type { ProcessStep, Project } from '../entities';
import type { IProcessStepRepository, IProjectRepository } from '../ports';
import { type Result, success } from '@/domain/shared/types';

const DESIGN_REQUIRED_CODES = ['DESIGN_3D', 'DESIGN_2D', 'DESIGN_REVIEW', 'DESIGN_BOM'];

export interface ProgressDesignStepInput {
  projectId: string;
  stepId: string;
  action: 'START' | 'COMPLETE';
}

export interface ProgressDesignStepResult {
  updatedStep: ProcessStep;
  activatedNextStep: ProcessStep | null;
  updatedProject: Project | null;
  designCompleted: boolean;
}

export class ProgressDesignStepUseCase {
  constructor(
    private readonly processStepRepo: IProcessStepRepository,
    private readonly projectRepo: IProjectRepository,
  ) {}

  async execute(input: ProgressDesignStepInput): Promise<Result<ProgressDesignStepResult>> {
    const today = new Date().toISOString().split('T')[0];

    const updatedStep =
      input.action === 'START'
        ? await this.processStepRepo.update(input.stepId, {
            status: 'IN_PROGRESS',
            start_date: today,
          })
        : await this.processStepRepo.update(input.stepId, {
            status: 'COMPLETED',
            end_date: today,
          });

    if (input.action === 'START') {
      return success({
        updatedStep,
        activatedNextStep: null,
        updatedProject: null,
        designCompleted: false,
      });
    }

    const allSteps = (await this.processStepRepo.findByProjectId(input.projectId)).sort(
      (a, b) => a.sequence - b.sequence,
    );
    const designSteps = allSteps.filter((s) => s.category === 'DESIGN');
    const designCompleted = DESIGN_REQUIRED_CODES.every(
      (code) => designSteps.find((s) => s.process_code === code)?.status === 'COMPLETED',
    );

    if (!designCompleted) {
      return success({
        updatedStep,
        activatedNextStep: null,
        updatedProject: null,
        designCompleted: false,
      });
    }

    const updatedProject = await this.projectRepo.update(input.projectId, {
      status: 'DESIGN_COMPLETE',
    });

    const nextStep = allSteps.find((s) => s.category !== 'DESIGN' && s.status === 'PLANNED');

    if (!nextStep) {
      return success({
        updatedStep,
        activatedNextStep: null,
        updatedProject,
        designCompleted: true,
      });
    }

    const activatedNextStep = await this.processStepRepo.update(nextStep.id, {
      status: 'IN_PROGRESS',
      start_date: today,
    });

    return success({
      updatedStep,
      activatedNextStep,
      updatedProject,
      designCompleted: true,
    });
  }
}
