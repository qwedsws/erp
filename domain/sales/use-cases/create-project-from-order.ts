import type { Order } from '../entities';
import type { Project, MoldType, Priority } from '../../projects/entities';
import type { IProjectRepository } from '../../projects/ports';
import { type Result, success, failure } from '@/domain/shared/types';
import { ValidationError } from '@/domain/shared/errors';

export interface CreateProjectFromOrderInput {
  order: Pick<Order, 'id' | 'title' | 'delivery_date'>;
  mold_type?: MoldType;
  priority?: Priority;
  description?: string;
}

export class CreateProjectFromOrderUseCase {
  constructor(private readonly projectRepo: IProjectRepository) {}

  async execute(input: CreateProjectFromOrderInput): Promise<Result<Project>> {
    if (!input.order.id || !input.order.title || !input.order.delivery_date) {
      return failure(new ValidationError('order.id, order.title, order.delivery_date are required'));
    }

    const project = await this.projectRepo.create({
      order_id: input.order.id,
      name: input.order.title,
      mold_type: input.mold_type ?? 'INJECTION',
      status: 'CONFIRMED',
      priority: input.priority ?? 'MEDIUM',
      due_date: input.order.delivery_date,
      description: input.description,
    });

    return success(project);
  }
}
