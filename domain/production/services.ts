import type { WorkOrder, WorkLog } from './entities';
import type { ProcessStep, ProjectStatus } from '@/domain/shared/entities';
import type { IWorkOrderRepository, IWorkLogRepository } from './ports';

export class WorkOrderService {
  constructor(private readonly workOrderRepo: IWorkOrderRepository) {}

  async getAll(): Promise<WorkOrder[]> {
    return this.workOrderRepo.findAll();
  }

  async getById(id: string): Promise<WorkOrder | null> {
    return this.workOrderRepo.findById(id);
  }

  async create(data: Omit<WorkOrder, 'id' | 'work_order_no' | 'created_at' | 'updated_at'>): Promise<WorkOrder> {
    return this.workOrderRepo.create(data);
  }

  async update(id: string, data: Partial<WorkOrder>): Promise<WorkOrder> {
    return this.workOrderRepo.update(id, data);
  }
}

export class WorkLogService {
  constructor(private readonly workLogRepo: IWorkLogRepository) {}

  async getAll(): Promise<WorkLog[]> {
    return this.workLogRepo.findAll();
  }

  async getByWorkOrderId(workOrderId: string): Promise<WorkLog[]> {
    return this.workLogRepo.findByWorkOrderId(workOrderId);
  }

  async create(data: Omit<WorkLog, 'id' | 'created_at'>): Promise<WorkLog> {
    return this.workLogRepo.create(data);
  }
}

// --- Project status ordering ---

const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  'CONFIRMED',
  'DESIGNING',
  'DESIGN_COMPLETE',
  'MATERIAL_PREP',
  'MACHINING',
  'ASSEMBLING',
  'TRYOUT',
  'REWORK',
  'FINAL_INSPECTION',
  'READY_TO_SHIP',
  'SHIPPED',
  'DELIVERED',
  'AS_SERVICE',
];

/**
 * Returns true if `candidate` is later in the project lifecycle than `current`.
 */
export function isStatusLater(current: ProjectStatus, candidate: ProjectStatus): boolean {
  const currentIdx = PROJECT_STATUS_ORDER.indexOf(current);
  const candidateIdx = PROJECT_STATUS_ORDER.indexOf(candidate);
  return candidateIdx > currentIdx;
}

/**
 * Pure function: given all process steps for a project, determine the project
 * status that reflects the current step completion state.
 *
 * Returns null when no status change is warranted.
 *
 * NOTE: The existing `ProgressDesignStepUseCase` in domain/projects/use-cases
 * handles design step progression triggered from the Design UI. This function
 * covers the same transition (plus production/assembly/quality) but is triggered
 * from WorkOrder status changes. Both flows are valid entry points; the
 * `isStatusLater` guard in the hook ensures only forward transitions are applied.
 */
export function resolveProjectStatusFromSteps(steps: ProcessStep[]): ProjectStatus | null {
  const byCategory = new Map<string, ProcessStep[]>();
  for (const step of steps) {
    const arr = byCategory.get(step.category) || [];
    arr.push(step);
    byCategory.set(step.category, arr);
  }

  const allCompleted = (cat: string): boolean => {
    const catSteps = byCategory.get(cat) || [];
    return catSteps.length > 0 && catSteps.every((s) => s.status === 'COMPLETED');
  };

  // Check from latest phase backwards so the most-advanced applicable status wins
  if (allCompleted('QUALITY')) return 'FINAL_INSPECTION';
  if (allCompleted('ASSEMBLY')) return 'ASSEMBLING'; // assembly done → move to tryout
  if (allCompleted('PRODUCTION')) return 'MACHINING'; // production done → move to assembling
  if (allCompleted('DESIGN')) return 'DESIGN_COMPLETE';

  // Check if any production started
  const productionSteps = byCategory.get('PRODUCTION') || [];
  if (productionSteps.some((s) => s.status === 'IN_PROGRESS')) return 'MACHINING';

  const designSteps = byCategory.get('DESIGN') || [];
  if (designSteps.some((s) => s.status === 'IN_PROGRESS')) return 'DESIGNING';

  return null; // no change needed
}
