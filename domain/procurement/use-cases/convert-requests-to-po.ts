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
    const targetRequestIds = new Set(input.prIds);

    const allRequests = await this.prRepo.findAll();
    const requests = allRequests.filter(
      pr => targetRequestIds.has(pr.id) && pr.status === 'APPROVED',
    );

    if (requests.length === 0) {
      return failure(new ValidationError('No approved purchase requests found'));
    }

    const uniqueMaterialIds = [...new Set(requests.map(pr => pr.material_id))];
    const materialEntries = await Promise.all(
      uniqueMaterialIds.map(async (materialId) => {
        const material = await this.materialRepo.findById(materialId);
        return [materialId, material] as const;
      }),
    );
    const materialById = new Map(materialEntries);

    const items = await Promise.all(
      requests.map(async pr => {
        const material = materialById.get(pr.material_id);

        // Inherit STEEL dimension fields from purchase request
        const hasDimensions = pr.dimension_w && pr.dimension_l && pr.dimension_h;
        const isSteel = material?.category === 'STEEL' && material.density && material.price_per_kg;

        let unitPrice = material?.unit_price ?? 0;
        let pieceWeight: number | undefined;
        let totalWeight: number | undefined;

        if (isSteel && hasDimensions && material.density && material.price_per_kg) {
          pieceWeight = pr.piece_weight ?? (material.density * pr.dimension_w! * pr.dimension_l! * pr.dimension_h! / 1_000_000);
          totalWeight = Math.round(pieceWeight * pr.quantity * 100) / 100;
          unitPrice = Math.round(pieceWeight * material.price_per_kg);
        }

        return {
          id: generateId(),
          material_id: pr.material_id,
          quantity: pr.quantity,
          unit_price: unitPrice,
          received_quantity: 0,
          // Pass dimension fields from PR to PO item
          ...(hasDimensions ? {
            dimension_w: pr.dimension_w,
            dimension_l: pr.dimension_l,
            dimension_h: pr.dimension_h,
            piece_weight: pieceWeight,
            total_weight: totalWeight,
          } : {}),
        };
      }),
    );

    const total_amount = items.reduce((sum, it) => {
      // For items with total_weight and steel pricing, use weight-based amount
      if (it.total_weight) {
        const material = materialById.get(it.material_id);
        if (material?.price_per_kg) {
          return sum + Math.round(it.total_weight * material.price_per_kg);
        }
      }
      return sum + it.quantity * it.unit_price;
    }, 0);

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
