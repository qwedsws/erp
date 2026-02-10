import type { PurchaseOrder, PurchaseRequest } from '../entities';
import type { IPurchaseOrderRepository, IPurchaseRequestRepository } from '../ports';
import { type Result, success, failure } from '@/domain/shared/types';
import { ValidationError } from '@/domain/shared/errors';
import {
  CreatePurchaseOrderUseCase,
  type CreatePurchaseOrderInput,
} from './create-purchase-order';

export interface CreatePOWithPRLinkInput {
  poData: CreatePurchaseOrderInput;
  linkedPrIds: string[];
}

export interface CreatePOWithPRLinkResult {
  purchaseOrder: PurchaseOrder;
  updatedRequests: PurchaseRequest[];
}

/**
 * Creates a PurchaseOrder and links the specified PurchaseRequests (mark COMPLETED).
 *
 * Compensation: if PR update fails, the already-created PO is deleted so the
 * system never ends up in an inconsistent state (PO exists but PRs are still
 * IN_PROGRESS).
 *
 * When linkedPrIds is empty, this behaves identically to CreatePurchaseOrderUseCase.
 */
export class CreatePOWithPRLinkUseCase {
  private readonly createPOUseCase: CreatePurchaseOrderUseCase;

  constructor(
    private readonly poRepo: IPurchaseOrderRepository,
    private readonly prRepo: IPurchaseRequestRepository,
  ) {
    this.createPOUseCase = new CreatePurchaseOrderUseCase(poRepo);
  }

  async execute(input: CreatePOWithPRLinkInput): Promise<Result<CreatePOWithPRLinkResult>> {
    // --- Step 1: Create PO (delegates validation to CreatePurchaseOrderUseCase) ---
    const poResult = await this.createPOUseCase.execute(input.poData);
    if (!poResult.ok) return poResult;

    const purchaseOrder = poResult.value;

    // --- Step 2: No linked PRs → done ---
    const linkedPrIds = [...new Set(input.linkedPrIds)];
    if (linkedPrIds.length === 0) {
      return success({ purchaseOrder, updatedRequests: [] });
    }

    // --- Step 3: Mark linked PRs as COMPLETED with po_id ---
    let updatedRequests: PurchaseRequest[];
    try {
      updatedRequests = await Promise.all(
        linkedPrIds.map((prId) =>
          this.prRepo.update(prId, { status: 'COMPLETED', po_id: purchaseOrder.id }),
        ),
      );
    } catch (prUpdateErr) {
      // Compensation: delete the just-created PO to restore consistency
      console.error('[CreatePOWithPRLink] PR update failed, compensating by deleting PO:', {
        poId: purchaseOrder.id,
        error: prUpdateErr instanceof Error ? prUpdateErr.message : String(prUpdateErr),
      });
      try {
        await this.poRepo.delete(purchaseOrder.id);
      } catch (delErr) {
        console.error('[CreatePOWithPRLink] Failed to delete PO during compensation:', {
          poId: purchaseOrder.id,
          error: delErr instanceof Error ? delErr.message : String(delErr),
        });
      }
      return failure(
        prUpdateErr instanceof Error
          ? prUpdateErr
          : new ValidationError(String(prUpdateErr)),
      );
    }

    return success({ purchaseOrder, updatedRequests });
  }
}
