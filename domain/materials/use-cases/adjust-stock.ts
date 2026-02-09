import type { Stock, StockMovement } from '../entities';
import type { IStockRepository, IStockMovementRepository } from '../ports';
import { generateId, type Result, success } from '@/domain/shared/types';

export interface AdjustStockInput {
  material_id: string;
  quantity: number;
  reason: string;
}

export class AdjustStockUseCase {
  constructor(
    private readonly stockRepo: IStockRepository,
    private readonly movementRepo: IStockMovementRepository,
  ) {}

  async execute(input: AdjustStockInput): Promise<Result<{ movement: StockMovement; stock: Stock }>> {
    const now = new Date().toISOString();

    const movement = await this.movementRepo.create({
      material_id: input.material_id,
      type: 'ADJUST',
      quantity: input.quantity,
      reason: input.reason,
    });

    const existing = await this.stockRepo.findByMaterialId(input.material_id);
    const nextQty = Math.max(0, (existing?.quantity ?? 0) + input.quantity);

    const stock = await this.stockRepo.upsert(
      existing
        ? { ...existing, quantity: nextQty, updated_at: now }
        : {
            id: generateId(),
            material_id: input.material_id,
            quantity: nextQty,
            avg_unit_price: 0,
            updated_at: now,
          },
    );

    return success({ movement, stock });
  }
}
