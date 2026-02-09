import type { PurchaseOrder, PurchaseRequest } from '../entities';
import type { IPurchaseRequestRepository, IPurchaseOrderRepository } from '../ports';
import type { IMaterialRepository } from '../../materials/ports';
import { generateId, type Result, success, failure } from '@/domain/shared/types';
import { ValidationError } from '@/domain/shared/errors';

export interface ConvertRequestsToPOInput {
  prIds: string[];
  supplierId: string;
}

export interface ConvertRequestsToPOResult {
  purchaseOrder: PurchaseOrder;
  updatedRequests: PurchaseRequest[];
}

export class ConvertRequestsToPOUseCase {
  constructor(
    private readonly prRepo: IPurchaseRequestRepository,
    private readonly poRepo: IPurchaseOrderRepository,
    private readonly materialRepo: IMaterialRepository,
  ) {}

  async execute(input: ConvertRequestsToPOInput): Promise<Result<ConvertRequestsToPOResult>> {
    const now = new Date().toISOString();

    const allRequests = await this.prRepo.findAll();
    const requests = allRequests.filter(
      pr => input.prIds.includes(pr.id) && pr.status === 'APPROVED',
    );

    if (requests.length === 0) {
      return failure(new ValidationError('No approved purchase requests found'));
    }

    const items = await Promise.all(
      requests.map(async pr => {
        const material = await this.materialRepo.findById(pr.material_id);
        return {
          id: generateId(),
          material_id: pr.material_id,
          quantity: pr.quantity,
          unit_price: material?.unit_price ?? 0,
          received_quantity: 0,
        };
      }),
    );

    const total_amount = items.reduce((sum, it) => sum + it.quantity * it.unit_price, 0);

    const purchaseOrder = await this.poRepo.create({
      supplier_id: input.supplierId,
      status: 'DRAFT',
      order_date: now.split('T')[0],
      due_date: requests[0]?.required_date || now.split('T')[0],
      items,
      total_amount,
    });

    const updatedRequests: PurchaseRequest[] = [];
    for (const pr of requests) {
      const updated = await this.prRepo.update(pr.id, {
        status: 'CONVERTED',
        po_id: purchaseOrder.id,
      });
      updatedRequests.push(updated);
    }

    return success({ purchaseOrder, updatedRequests });
  }
}
