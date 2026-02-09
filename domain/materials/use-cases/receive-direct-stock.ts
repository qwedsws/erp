import type { Stock, StockMovement } from '../entities';
import type { IStockRepository, IStockMovementRepository } from '../ports';
import { generateId, type Result, success } from '@/domain/shared/types';

export interface ReceiveDirectStockInput {
  material_id: string;
  quantity: number;
  unit_price?: number;
  project_id?: string;
  reason?: string;
}

export class ReceiveDirectStockUseCase {
  constructor(
    private readonly stockRepo: IStockRepository,
    private readonly movementRepo: IStockMovementRepository,
  ) {}

  async execute(input: ReceiveDirectStockInput): Promise<Result<{ movement: StockMovement; stock: Stock }>> {
    const now = new Date().toISOString();

    const movement = await this.movementRepo.create({
      material_id: input.material_id,
      type: 'IN',
      quantity: input.quantity,
      unit_price: input.unit_price,
      project_id: input.project_id,
      reason: input.reason,
    });

    const existing = await this.stockRepo.findByMaterialId(input.material_id);
    let stock: Stock;

    if (existing) {
      const price = input.unit_price ?? existing.avg_unit_price;
      const nextQty = existing.quantity + input.quantity;
      const nextAvg =
        nextQty > 0
          ? Math.round(
              (existing.quantity * existing.avg_unit_price + input.quantity * price) / nextQty,
            )
          : existing.avg_unit_price;

      stock = await this.stockRepo.upsert({
        ...existing,
        quantity: nextQty,
        avg_unit_price: nextAvg,
        updated_at: now,
      });
    } else {
      stock = await this.stockRepo.upsert({
        id: generateId(),
        material_id: input.material_id,
        quantity: input.quantity,
        avg_unit_price: input.unit_price ?? 0,
        updated_at: now,
      });
    }

    return success({ movement, stock });
  }
}
