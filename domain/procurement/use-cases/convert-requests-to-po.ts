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
  purchaseOrders: PurchaseOrder[];
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
    const targetRequestIds = [...new Set(input.prIds)];

    if (targetRequestIds.length === 0) {
      return failure(new ValidationError('No purchase requests selected'));
    }

    const requests = (await this.prRepo.findByIds(targetRequestIds)).filter(
      (pr) => pr.status === 'IN_PROGRESS',
    );

    if (requests.length === 0) {
      return failure(new ValidationError('No in-progress purchase requests found'));
    }

    const uniqueMaterialIds = [...new Set(requests.map(pr => pr.material_id))];
    const materialById = new Map(
      (await this.materialRepo.findByIds(uniqueMaterialIds)).map((material) => [material.id, material]),
    );

    // Group in-progress PRs by project_id (null key for common-stock PRs without a project)
    const PROJECT_NULL_KEY = '__NO_PROJECT__';
    const groupedByProject = new Map<string, typeof requests>();
    for (const pr of requests) {
      const key = pr.project_id ?? PROJECT_NULL_KEY;
      if (!groupedByProject.has(key)) groupedByProject.set(key, []);
      groupedByProject.get(key)!.push(pr);
    }

    // Build one PO per project group
    const purchaseOrders: PurchaseOrder[] = [];

    for (const [projectKey, groupRequests] of groupedByProject) {
      const items = groupRequests.map((pr) => {
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
      });

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

      const po = await this.poRepo.create({
        supplier_id: input.supplierId,
        ...(projectKey !== PROJECT_NULL_KEY ? { project_id: projectKey } : {}),
        status: 'DRAFT',
        order_date: now.split('T')[0],
        due_date: groupRequests[0]?.required_date || now.split('T')[0],
        items,
        total_amount,
      });

      purchaseOrders.push(po);
    }

    // Build a map from project_id to created PO id for linking PRs
    const poIdByProjectKey = new Map<string, string>();
    for (const [projectKey, ] of groupedByProject) {
      const po = purchaseOrders.find((p) =>
        projectKey === PROJECT_NULL_KEY ? !p.project_id : p.project_id === projectKey,
      );
      if (po) poIdByProjectKey.set(projectKey, po.id);
    }

    let updatedRequests: PurchaseRequest[];
    try {
      updatedRequests = await Promise.all(
        requests.map((pr) => {
          const key = pr.project_id ?? PROJECT_NULL_KEY;
          return this.prRepo.update(pr.id, {
            status: 'COMPLETED',
            po_id: poIdByProjectKey.get(key),
          });
        }),
      );
    } catch (prUpdateErr) {
      // Compensation: delete created POs to avoid orphaned orders
      console.error('[ConvertRequestsToPO] PR update failed, compensating by deleting created POs:', {
        poIds: purchaseOrders.map(po => po.id),
        error: prUpdateErr instanceof Error ? prUpdateErr.message : String(prUpdateErr),
      });
      for (const po of purchaseOrders) {
        try {
          await this.poRepo.delete(po.id);
        } catch (delErr) {
          console.error('[ConvertRequestsToPO] Failed to delete PO during compensation:', {
            poId: po.id,
            error: delErr instanceof Error ? delErr.message : String(delErr),
          });
        }
      }
      return failure(prUpdateErr instanceof Error ? prUpdateErr : new Error(String(prUpdateErr)));
    }

    return success({ purchaseOrders, updatedRequests });
  }
}
