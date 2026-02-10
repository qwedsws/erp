import type { Order } from '../entities';
import type { IOrderRepository } from '../ports';
import type { Project, ProcessStep, MoldType, Priority } from '../../projects/entities';
import type { IProjectRepository, IProcessStepRepository } from '../../projects/ports';
import { type Result, success, failure } from '@/domain/shared/types';
import { ValidationError } from '@/domain/shared/errors';

export interface CreateOrderWithProjectInput {
  customer_id: string;
  title: string;
  order_date: string;
  delivery_date: string;
  total_amount?: number;
  notes?: string;
  createProject?: boolean;
  mold_type?: MoldType;
  priority?: Priority;
}

export interface CreateOrderWithProjectResult {
  order: Order;
  project: Project | null;
  designSteps: ProcessStep[];
}

const DESIGN_STEPS = [
  { process_code: 'DESIGN_3D', process_name: '3D 설계', sequence: 1 },
  { process_code: 'DESIGN_2D', process_name: '2D 도면', sequence: 2 },
  { process_code: 'DESIGN_REVIEW', process_name: '설계 검토', sequence: 3 },
  { process_code: 'DESIGN_BOM', process_name: 'BOM 작성', sequence: 4 },
] as const;

export class CreateOrderWithProjectUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly projectRepo: IProjectRepository,
    private readonly stepRepo: IProcessStepRepository,
  ) {}

  async execute(input: CreateOrderWithProjectInput): Promise<Result<CreateOrderWithProjectResult>> {
    if (!input.customer_id || !input.title || !input.delivery_date) {
      return failure(new ValidationError('customer_id, title, delivery_date are required'));
    }

    const order = await this.orderRepo.create({
      customer_id: input.customer_id,
      title: input.title,
      status: 'CONFIRMED',
      order_date: input.order_date,
      delivery_date: input.delivery_date,
      total_amount: input.total_amount,
      notes: input.notes,
    });

    if (!input.createProject) {
      return success({ order, project: null, designSteps: [] });
    }

    let project: Project;
    try {
      project = await this.projectRepo.create({
        order_id: order.id,
        name: input.title,
        mold_type: input.mold_type ?? 'INJECTION',
        status: 'CONFIRMED',
        priority: input.priority ?? 'MEDIUM',
        due_date: input.delivery_date,
        description: input.notes,
      });
    } catch (projErr) {
      // TODO: Full DB transaction requires Supabase RPC — order already created
      console.error('[CreateOrderWithProject] Project creation failed after order created:', {
        orderId: order.id,
        error: projErr instanceof Error ? projErr.message : String(projErr),
      });
      return failure(projErr instanceof Error ? projErr : new Error(String(projErr)));
    }

    // Idempotency: check if design steps already exist for this project
    const existing = await this.stepRepo.findByProjectId(project.id);
    const hasDesignSteps = existing.some((s) => s.category === 'DESIGN');

    if (hasDesignSteps) {
      return success({
        order,
        project,
        designSteps: existing.filter((s) => s.category === 'DESIGN'),
      });
    }

    // Seed initial design process steps
    const stepData = DESIGN_STEPS.map((s) => ({
      project_id: project.id,
      category: 'DESIGN' as const,
      process_code: s.process_code,
      process_name: s.process_name,
      sequence: s.sequence,
      status: 'PLANNED' as const,
    }));

    let designSteps: ProcessStep[];
    try {
      designSteps = await this.stepRepo.createMany(stepData);
    } catch (stepErr) {
      // TODO: Full DB transaction requires Supabase RPC — order+project already created
      console.error('[CreateOrderWithProject] Design steps creation failed:', {
        orderId: order.id,
        projectId: project.id,
        error: stepErr instanceof Error ? stepErr.message : String(stepErr),
      });
      return failure(stepErr instanceof Error ? stepErr : new Error(String(stepErr)));
    }

    return success({ order, project, designSteps });
  }
}
