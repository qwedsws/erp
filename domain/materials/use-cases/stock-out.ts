import type { Stock, StockMovement } from '../entities';
import type { IStockRepository, IStockMovementRepository } from '../ports';
import { type Result, success, failure } from '@/domain/shared/types';
import { InsufficientStockError } from '@/domain/shared/errors';

export interface StockOutInput {
  material_id: string;
  quantity: number;
  project_id: string;
  reason?: string;
}

export class StockOutUseCase {
  constructor(
    private readonly stockRepo: IStockRepository,
    private readonly movementRepo: IStockMovementRepository,
  ) {}

  async execute(input: StockOutInput): Promise<Result<{ movement: StockMovement; stock: Stock }>> {
    const now = new Date().toISOString();

    const stock = await this.stockRepo.findByMaterialId(input.material_id);
    if (!stock || stock.quantity < input.quantity) {
      return failure(
        new InsufficientStockError(input.material_id, input.quantity, stock?.quantity ?? 0),
      );
    }

    const movement = await this.movementRepo.create({
      material_id: input.material_id,
      type: 'OUT',
      quantity: input.quantity,
      unit_price: stock.avg_unit_price,
      project_id: input.project_id,
      reason: input.reason || undefined,
    });

    const updatedStock = await this.stockRepo.upsert({
      ...stock,
      quantity: stock.quantity - input.quantity,
      updated_at: now,
    });

    return success({ movement, stock: updatedStock });
  }
}
