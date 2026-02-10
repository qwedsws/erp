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
    const uniqueMaterialIds = [...new Set(input.adjustments.map((adj) => adj.material_id))];
    const stockEntries = await Promise.all(
      uniqueMaterialIds.map(async (materialId) => {
        const stock = await this.stockRepo.findByMaterialId(materialId);
        return [materialId, stock] as const;
      }),
    );
    const stockByMaterialId = new Map(stockEntries);
    const movementInputs: Omit<StockMovement, 'id' | 'created_at'>[] = [];
    const stockUpsertByMaterialId = new Map<string, Stock>();

    for (const adj of input.adjustments) {
      const stock = stockByMaterialId.get(adj.material_id) ?? null;
      const currentQty = stock?.quantity ?? 0;
      const diff = adj.actual_qty - currentQty;

      if (diff === 0) continue;

      movementInputs.push({
        material_id: adj.material_id,
        type: 'ADJUST',
        quantity: diff,
        reason: `재고 실사 조정 (${currentQty} → ${adj.actual_qty})`,
      });

      if (stock) {
        const updatedStock: Stock = {
          ...stock,
          quantity: adj.actual_qty,
          updated_at: now,
        };
        stockByMaterialId.set(adj.material_id, updatedStock);
        stockUpsertByMaterialId.set(adj.material_id, updatedStock);
      } else {
        const newStock: Stock = {
          id: generateId(),
          material_id: adj.material_id,
          quantity: adj.actual_qty,
          avg_unit_price: 0,
          updated_at: now,
        };
        stockByMaterialId.set(adj.material_id, newStock);
        stockUpsertByMaterialId.set(adj.material_id, newStock);
      }
    }

    const movements = this.movementRepo.createMany
      ? await this.movementRepo.createMany(movementInputs)
      : await Promise.all(movementInputs.map((movementInput) => this.movementRepo.create(movementInput)));

    const stockUpserts = [...stockUpsertByMaterialId.values()];
    const stocks = this.stockRepo.upsertMany
      ? await this.stockRepo.upsertMany(stockUpserts)
      : await Promise.all(stockUpserts.map((stock) => this.stockRepo.upsert(stock)));

    return success({ movements, stocks });
  }
}
