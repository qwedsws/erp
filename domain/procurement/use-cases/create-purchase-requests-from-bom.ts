import type { PurchaseRequest } from '../entities';
import type { IPurchaseRequestRepository } from '../ports';
import { type Result, success, failure } from '@/domain/shared/types';
import { ValidationError } from '@/domain/shared/errors';

export interface BomItem {
  material_id: string;
  quantity: number;
  dimension_w?: number;
  dimension_l?: number;
  dimension_h?: number;
}

export interface CreatePRsFromBomInput {
  projectId: string;
  bomItems: BomItem[];
  requestedBy: string;
}

export interface CreatePRsFromBomResult {
  purchaseRequests: PurchaseRequest[];
}

export class CreatePurchaseRequestsFromBomUseCase {
  constructor(private readonly prRepo: IPurchaseRequestRepository) {}

  async execute(input: CreatePRsFromBomInput): Promise<Result<CreatePRsFromBomResult>> {
    if (input.bomItems.length === 0) {
      return failure(new ValidationError('BOM items are empty'));
    }

    // Check for existing PRs for this project to prevent duplicates
    const allPRs = await this.prRepo.findAll();
    const existingPRsForProject = allPRs.filter(
      (pr) => pr.project_id === input.projectId && pr.status !== 'REJECTED',
    );

    // Filter out items that already have PRs (by material_id)
    const existingMaterialIds = new Set(existingPRsForProject.map((pr) => pr.material_id));
    const newItems = input.bomItems.filter((item) => !existingMaterialIds.has(item.material_id));

    if (newItems.length === 0) {
      return success({ purchaseRequests: [] });
    }

    const requiredDate = new Date();
    requiredDate.setDate(requiredDate.getDate() + 14); // 2 weeks default lead time

    const prInputs = newItems.map((item) => ({
      material_id: item.material_id,
      quantity: item.quantity,
      required_date: requiredDate.toISOString().split('T')[0],
      reason: `BOM 자동생성 (프로젝트)`,
      requested_by: input.requestedBy,
      status: 'IN_PROGRESS' as const,
      project_id: input.projectId,
      ...(item.dimension_w
        ? {
            dimension_w: item.dimension_w,
            dimension_l: item.dimension_l,
            dimension_h: item.dimension_h,
          }
        : {}),
    }));

    const purchaseRequests = await this.prRepo.createMany(prInputs);
    return success({ purchaseRequests });
  }
}
