import type { PurchaseOrder, PurchaseOrderStatus } from '../entities';
import type { IPurchaseOrderRepository } from '../ports';
import { generateId, type Result, success, failure } from '@/domain/shared/types';
import { ValidationError } from '@/domain/shared/errors';

export interface CreatePurchaseOrderItemInput {
  id?: string;
  material_id: string;
  quantity: number;
  unit_price: number;
  received_quantity?: number;
}

export interface CreatePurchaseOrderInput {
  supplier_id: string;
  status?: PurchaseOrderStatus;
  order_date: string;
  due_date?: string;
  total_amount?: number;
  items: CreatePurchaseOrderItemInput[];
  notes?: string;
  created_by?: string;
}

export class CreatePurchaseOrderUseCase {
  constructor(private readonly poRepo: IPurchaseOrderRepository) {}

  async execute(input: CreatePurchaseOrderInput): Promise<Result<PurchaseOrder>> {
    if (!input.supplier_id) {
      return failure(new ValidationError('Supplier is required'));
    }

    if (!input.order_date) {
      return failure(new ValidationError('Order date is required'));
    }

    if (input.items.length === 0) {
      return failure(new ValidationError('At least one item is required'));
    }

    for (const item of input.items) {
      if (!item.material_id) {
        return failure(new ValidationError('Material is required for all items'));
      }
      if (!item.quantity || item.quantity <= 0) {
        return failure(new ValidationError('Quantity must be greater than zero'));
      }
    }

    const items = input.items.map((item) => ({
      id: item.id ?? generateId(),
      material_id: item.material_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      received_quantity: item.received_quantity ?? 0,
    }));

    const purchaseOrder = await this.poRepo.create({
      supplier_id: input.supplier_id,
      status: input.status ?? 'DRAFT',
      order_date: input.order_date,
      due_date: input.due_date,
      total_amount: input.total_amount,
      items,
      notes: input.notes,
      created_by: input.created_by,
    });

    return success(purchaseOrder);
  }
}
