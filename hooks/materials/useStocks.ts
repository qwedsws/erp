'use client';

import { useERPStore } from '@/store';
import { getStockMovementRepository, getStockRepository } from '@/infrastructure/di/container';
import { StockOutUseCase } from '@/domain/materials/use-cases/stock-out';
import { AdjustStockUseCase } from '@/domain/materials/use-cases/adjust-stock';
import { BulkAdjustStockUseCase } from '@/domain/materials/use-cases/bulk-adjust-stock';
import { ReceiveDirectStockUseCase } from '@/domain/materials/use-cases/receive-direct-stock';
import type { StockMovement } from '@/domain/materials/entities';
import { useAsyncAction } from '@/hooks/shared/useAsyncAction';

export function useStocks() {
  const stocks = useERPStore((s) => s.stocks);
  const stockMovements = useERPStore((s) => s.stockMovements);
  const addMovementToCache = useERPStore((s) => s.addStockMovementToCache);
  const upsertStockInCache = useERPStore((s) => s.upsertStockInCache);
  const { run, isLoading, error } = useAsyncAction();

  const stockRepo = getStockRepository();
  const movementRepo = getStockMovementRepository();

  const stockOutUseCase = new StockOutUseCase(stockRepo, movementRepo);
  const adjustStockUseCase = new AdjustStockUseCase(stockRepo, movementRepo);
  const bulkAdjustStockUseCase = new BulkAdjustStockUseCase(stockRepo, movementRepo);
  const receiveDirectStockUseCase = new ReceiveDirectStockUseCase(stockRepo, movementRepo);

  const stockOut = (materialId: string, quantity: number, projectId: string, reason?: string) =>
    run(async () => {
      const result = await stockOutUseCase.execute({
        material_id: materialId, quantity, project_id: projectId, reason,
      });
      if (!result.ok) throw result.error;
      addMovementToCache(result.value.movement);
      upsertStockInCache(result.value.stock);
    });

  const adjustStock = (materialId: string, quantity: number, reason: string) =>
    run(async () => {
      const result = await adjustStockUseCase.execute({
        material_id: materialId, quantity, reason,
      });
      if (!result.ok) throw result.error;
      addMovementToCache(result.value.movement);
      upsertStockInCache(result.value.stock);
    });

  const bulkAdjustStock = (adjustments: { material_id: string; actual_qty: number }[]) =>
    run(async () => {
      const result = await bulkAdjustStockUseCase.execute({ adjustments });
      if (!result.ok) throw result.error;
      for (const movement of result.value.movements) {
        addMovementToCache(movement);
      }
      for (const stock of result.value.stocks) {
        upsertStockInCache(stock);
      }
    });

  const receiveStock = (
    materialId: string, quantity: number, unitPrice?: number, projectId?: string, reason?: string,
  ) =>
    run(async () => {
      const result = await receiveDirectStockUseCase.execute({
        material_id: materialId, quantity, unit_price: unitPrice, project_id: projectId, reason,
      });
      if (!result.ok) throw result.error;
      addMovementToCache(result.value.movement);
      upsertStockInCache(result.value.stock);
    });

  const addStockMovement = async (data: Omit<StockMovement, 'id' | 'created_at'>) => {
    if (data.type === 'IN') {
      const result = await receiveStock(data.material_id, data.quantity, data.unit_price, data.project_id, data.reason);
      if (!result.ok) throw new Error(result.error);
      return;
    }
    if (data.type === 'OUT') {
      if (!data.project_id) {
        throw new Error('OUT movement requires project_id');
      }
      const result = await stockOut(data.material_id, data.quantity, data.project_id, data.reason);
      if (!result.ok) throw new Error(result.error);
      return;
    }
    const result = await adjustStock(data.material_id, data.quantity, data.reason || '재고 조정');
    if (!result.ok) throw new Error(result.error);
  };

  return {
    stocks, stockMovements,
    stockOut, adjustStock, bulkAdjustStock, receiveStock, addStockMovement,
    isLoading, error,
  };
}
