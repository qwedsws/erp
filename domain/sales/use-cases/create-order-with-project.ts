import type { Order } from '../entities';
import type { IOrderRepository } from '../ports';
import type { Project, MoldType, Priority } from '../../projects/entities';
import type { IProjectRepository } from '../../projects/ports';
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
}

export class CreateOrderWithProjectUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly projectRepo: IProjectRepository,
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
      return success({ order, project: null });
    }

    const project = await this.projectRepo.create({
      order_id: order.id,
      name: input.title,
      mold_type: input.mold_type ?? 'INJECTION',
      status: 'CONFIRMED',
      priority: input.priority ?? 'MEDIUM',
      due_date: input.delivery_date,
      description: input.notes,
    });

    return success({ order, project });
  }
}
