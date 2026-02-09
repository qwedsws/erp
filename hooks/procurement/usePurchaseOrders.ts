'use client';

import { useERPStore } from '@/store';
import {
  getMaterialPriceRepository,
  getPurchaseOrderRepository,
  getStockMovementRepository,
  getStockRepository,
} from '@/infrastructure/di/container';
import { ReceivePurchaseOrderUseCase } from '@/domain/materials/use-cases/receive-purchase-order';
import {
  CreatePurchaseOrderUseCase,
  type CreatePurchaseOrderInput,
} from '@/domain/procurement/use-cases/create-purchase-order';
import { useAsyncAction } from '@/hooks/shared/useAsyncAction';

export function usePurchaseOrders() {
  const purchaseOrders = useERPStore((s) => s.purchaseOrders);
  const addToCache = useERPStore((s) => s.addPurchaseOrderToCache);
  const updateInCache = useERPStore((s) => s.updatePurchaseOrderInCache);
  const removeFromCache = useERPStore((s) => s.removePurchaseOrderFromCache);
  const addMovementToCache = useERPStore((s) => s.addStockMovementToCache);
  const upsertStockInCache = useERPStore((s) => s.upsertStockInCache);
  const addPriceToCache = useERPStore((s) => s.addMaterialPriceToCache);
  const { run, isLoading, error } = useAsyncAction();

  const repo = getPurchaseOrderRepository();
  const stockRepo = getStockRepository();
  const movementRepo = getStockMovementRepository();
  const priceRepo = getMaterialPriceRepository();
  const receivePurchaseOrderUseCase = new ReceivePurchaseOrderUseCase(
    repo, stockRepo, movementRepo, priceRepo,
  );
  const createPurchaseOrderUseCase = new CreatePurchaseOrderUseCase(repo);

  const createPurchaseOrder = (input: CreatePurchaseOrderInput) =>
    run(async () => {
      const result = await createPurchaseOrderUseCase.execute(input);
      if (!result.ok) throw result.error;
      addToCache(result.value);
      return result.value;
    });

  const updatePurchaseOrder = (id: string, data: Parameters<typeof repo.update>[1]) =>
    run(async () => {
      const updated = await repo.update(id, data);
      updateInCache(id, updated);
      return updated;
    });

  const deletePurchaseOrder = (id: string) =>
    run(async () => {
      await repo.delete(id);
      removeFromCache(id);
    });

  const receivePurchaseOrder = (poId: string, items: { item_id: string; quantity: number }[]) =>
    run(async () => {
      const result = await receivePurchaseOrderUseCase.execute({ poId, items });
      if (!result.ok) throw result.error;

      updateInCache(poId, result.value.purchaseOrder);
      for (const movement of result.value.movements) {
        addMovementToCache(movement);
      }
      for (const stock of result.value.stocks) {
        upsertStockInCache(stock);
      }
      for (const price of result.value.prices) {
        addPriceToCache(price);
      }
    });

  return {
    purchaseOrders,
    createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, receivePurchaseOrder,
    isLoading, error,
  };
}
