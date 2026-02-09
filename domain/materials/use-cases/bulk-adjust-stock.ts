import type { Stock, StockMovement } from '../entities';
import type { IStockRepository, IStockMovementRepository } from '../ports';
import { generateId, type Result, success } from '@/domain/shared/types';

export interface BulkAdjustInput {
  adjustments: { material_id: string; actual_qty: number }[];
}

export class BulkAdjustStockUseCase {
  constructor(
    private readonly stockRepo: IStockRepository,
    private readonly movementRepo: IStockMovementRepository,
  ) {}

  async execute(input: BulkAdjustInput): Promise<Result<{ movements: StockMovement[]; stocks: Stock[] }>> {
    const now = new Date().toISOString();
    const movements: StockMovement[] = [];
    const stocks: Stock[] = [];
    const uniqueMaterialIds = [...new Set(input.adjustments.map((adj) => adj.material_id))];
    const stockEntries = await Promise.all(
      uniqueMaterialIds.map(async (materialId) => {
        const stock = await this.stockRepo.findByMaterialId(materialId);
        return [materialId, stock] as const;
      }),
    );
    const stockByMaterialId = new Map(stockEntries);

    for (const adj of input.adjustments) {
      const stock = stockByMaterialId.get(adj.material_id) ?? null;
      const currentQty = stock?.quantity ?? 0;
      const diff = adj.actual_qty - currentQty;

      if (diff === 0) continue;

      const movement = await this.movementRepo.create({
        material_id: adj.material_id,
        type: 'ADJUST',
        quantity: diff,
        reason: `재고 실사 조정 (${currentQty} → ${adj.actual_qty})`,
      });
      movements.push(movement);

      if (stock) {
        const updatedStock = await this.stockRepo.upsert({
          ...stock,
          quantity: adj.actual_qty,
          updated_at: now,
        });
        stockByMaterialId.set(adj.material_id, updatedStock);
        stocks.push(updatedStock);
      } else {
        const newStock = await this.stockRepo.upsert({
          id: generateId(),
          material_id: adj.material_id,
          quantity: adj.actual_qty,
          avg_unit_price: 0,
          updated_at: now,
        });
        stockByMaterialId.set(adj.material_id, newStock);
        stocks.push(newStock);
      }
    }

    return success({ movements, stocks });
  }
}
