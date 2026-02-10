'use client';

import { useEffect } from 'react';
import { useERPStore } from '@/store';
import {
  getStockMovementRepository,
  getStockRepository,
  getGLAccountRepository,
  getJournalEntryRepository,
  getAROpenItemRepository,
  getAPOpenItemRepository,
  getAccountingEventRepository,
} from '@/infrastructure/di/container';
import { StockOutUseCase } from '@/domain/materials/use-cases/stock-out';
import { AdjustStockUseCase } from '@/domain/materials/use-cases/adjust-stock';
import { BulkAdjustStockUseCase } from '@/domain/materials/use-cases/bulk-adjust-stock';
import { ReceiveDirectStockUseCase } from '@/domain/materials/use-cases/receive-direct-stock';
import { PostAccountingEventUseCase } from '@/domain/accounting/use-cases/post-accounting-event';
import type { StockMovement } from '@/domain/materials/entities';
import { useAsyncAction } from '@/hooks/shared/useAsyncAction';
import { useInitialHydration } from '@/hooks/admin/useInitialHydration';
import type { HydrationRequest } from '@/hooks/admin/useInitialHydration';

interface UseStocksOptions {
  includeStocks?: boolean;
  includeMovements?: boolean;
}

export function useStocks(options?: UseStocksOptions) {
  const stocks = useERPStore((s) => s.stocks);
  const stockMovements = useERPStore((s) => s.stockMovements);
  const addMovementToCache = useERPStore((s) => s.addStockMovementToCache);
  const upsertStockInCache = useERPStore((s) => s.upsertStockInCache);
  // Accounting cache
  const addJournalEntryToCache = useERPStore((s) => s.addJournalEntryToCache);
  const addAccountingEventToCache = useERPStore((s) => s.addAccountingEventToCache);
  const { run, isLoading, error } = useAsyncAction();
  const { hydrateResources, isResourceHydrated } = useInitialHydration();
  const includeStocks = options?.includeStocks ?? true;
  const includeMovements = options?.includeMovements ?? false;

  useEffect(() => {
    const requests: HydrationRequest[] = [];
    if (includeStocks) requests.push({ resource: 'stocks' as const });
    if (includeMovements) requests.push({ resource: 'stockMovements' as const });
    if (requests.length === 0) return;

    const allHydrated = requests.every((request) => isResourceHydrated(request.resource));
    if (allHydrated) return;

    void hydrateResources(requests);
  }, [hydrateResources, includeMovements, includeStocks, isResourceHydrated]);

  const stockRepo = getStockRepository();
  const movementRepo = getStockMovementRepository();

  const stockOutUseCase = new StockOutUseCase(stockRepo, movementRepo);
  const adjustStockUseCase = new AdjustStockUseCase(stockRepo, movementRepo);
  const bulkAdjustStockUseCase = new BulkAdjustStockUseCase(stockRepo, movementRepo);
  const receiveDirectStockUseCase = new ReceiveDirectStockUseCase(stockRepo, movementRepo);
  const postAccountingEventUseCase = new PostAccountingEventUseCase(
    getGLAccountRepository(), getJournalEntryRepository(), getAROpenItemRepository(), getAPOpenItemRepository(), getAccountingEventRepository(),
  );

  const stockOut = (materialId: string, quantity: number, projectId: string, reason?: string) =>
    run(async () => {
      const result = await stockOutUseCase.execute({
        material_id: materialId, quantity, project_id: projectId, reason,
      });
      if (!result.ok) throw result.error;
      addMovementToCache(result.value.movement);
      upsertStockInCache(result.value.stock);

      // Auto-journaling: STOCK_OUT
      try {
        const amount = quantity * (result.value.stock.avg_unit_price || 0);
        const postResult = await postAccountingEventUseCase.execute({
          source_type: 'STOCK_MOVEMENT',
          source_id: result.value.movement.id,
          source_no: result.value.movement.id,
          event_type: 'STOCK_OUT',
          payload: {
            material_id: materialId,
            project_id: projectId,
            amount,
            reason: reason || '자재 출고',
          },
        });
        if (postResult.ok) {
          addJournalEntryToCache(postResult.value.journalEntry);
          addAccountingEventToCache(postResult.value.event);
        }
      } catch {
        // Silent fail — accounting should not block stock out
      }
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
