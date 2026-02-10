import type { WorkOrder } from '../entities';
import type { IWorkOrderRepository } from '../ports';
import type { ProcessStep, Project, ProcessStepStatus } from '../../projects/entities';
import type { IProcessStepRepository, IProjectRepository } from '../../projects/ports';
import { type Result, success } from '@/domain/shared/types';
import { resolveProjectStatusFromSteps, isStatusLater } from '../services';

export type WorkOrderProgressAction = 'START' | 'COMPLETE';

export interface ProgressWorkOrderInput {
  workOrderId: string;
  action: WorkOrderProgressAction;
  occurredAt?: string;
}

export interface ProgressWorkOrderResult {
  workOrder: WorkOrder;
  updatedStep: ProcessStep | null;
  updatedProject: Project | null;
  syncWarning?: string;
}

export class ProgressWorkOrderUseCase {
  constructor(
    private readonly workOrderRepo: IWorkOrderRepository,
    private readonly processStepRepo: IProcessStepRepository,
    private readonly projectRepo: IProjectRepository,
  ) {}

  async execute(input: ProgressWorkOrderInput): Promise<Result<ProgressWorkOrderResult>> {
    const occurredAt = input.occurredAt ?? new Date().toISOString();
    const today = occurredAt.split('T')[0];

    const workOrder =
      input.action === 'START'
        ? await this.workOrderRepo.update(input.workOrderId, {
            status: 'IN_PROGRESS',
            actual_start: occurredAt,
          })
        : await this.workOrderRepo.update(input.workOrderId, {
            status: 'COMPLETED',
            actual_end: occurredAt,
          });

    if (!workOrder.process_step_id) {
      return success({ workOrder, updatedStep: null, updatedProject: null });
    }

    const stepStatus: ProcessStepStatus =
      input.action === 'START' ? 'IN_PROGRESS' : 'COMPLETED';

    try {
      const updatedStep = await this.processStepRepo.update(workOrder.process_step_id, {
        status: stepStatus,
        ...(stepStatus === 'IN_PROGRESS' ? { start_date: today } : { end_date: today }),
      });

      if (stepStatus !== 'COMPLETED') {
        return success({ workOrder, updatedStep, updatedProject: null });
      }

      const allSteps = await this.processStepRepo.findByProjectId(workOrder.project_id);
      const resolvedStatus = resolveProjectStatusFromSteps(allSteps);
      if (!resolvedStatus) {
        return success({ workOrder, updatedStep, updatedProject: null });
      }

      const currentProject = await this.projectRepo.findById(workOrder.project_id);
      if (!currentProject || !isStatusLater(currentProject.status, resolvedStatus)) {
        return success({ workOrder, updatedStep, updatedProject: null });
      }

      const updatedProject = await this.projectRepo.update(workOrder.project_id, {
        status: resolvedStatus,
      });

      return success({ workOrder, updatedStep, updatedProject });
    } catch (err) {
      const syncWarning =
        err instanceof Error ? err.message : 'Failed to sync step/project after work-order update';
      return success({ workOrder, updatedStep: null, updatedProject: null, syncWarning });
    }
  }
}
