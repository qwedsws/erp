'use client';

import { useEffect } from 'react';
import { useERPStore } from '@/store';
import {
  getMaterialRepository,
  getPurchaseOrderRepository,
  getPurchaseRequestRepository,
} from '@/infrastructure/di/container';
import { ConvertRequestsToPOUseCase } from '@/domain/procurement/use-cases/convert-requests-to-po';
import type { PurchaseOrder } from '@/domain/procurement/entities';
import { useAsyncAction } from '@/hooks/shared/useAsyncAction';

let prsLoaded = false;
let prsLoadPromise: Promise<void> | null = null;

export function usePurchaseRequests() {
  const purchaseRequests = useERPStore((s) => s.purchaseRequests);
  const setPurchaseRequests = useERPStore((s) => s.setPurchaseRequests);
  const addToCache = useERPStore((s) => s.addPurchaseRequestToCache);
  const updateInCache = useERPStore((s) => s.updatePurchaseRequestInCache);
  const removeFromCache = useERPStore((s) => s.removePurchaseRequestFromCache);
  const addPurchaseOrderToCache = useERPStore((s) => s.addPurchaseOrderToCache);
  const { run, isLoading, error } = useAsyncAction();

  const purchaseRequestRepo = getPurchaseRequestRepository();

  // Auto-load purchase requests from repository when store is empty
  useEffect(() => {
    if (prsLoaded || prsLoadPromise) return;
    prsLoadPromise = (async () => {
      try {
        const all = await purchaseRequestRepo.findAll();
        setPurchaseRequests(all);
        prsLoaded = true;
      } catch (err) {
        console.error('Failed to load purchase requests:', err);
      } finally {
        prsLoadPromise = null;
      }
    })();
  }, [purchaseRequestRepo, setPurchaseRequests]);
  const purchaseOrderRepo = getPurchaseOrderRepository();
  const materialRepo = getMaterialRepository();
  const convertRequestsToPOUseCase = new ConvertRequestsToPOUseCase(
    purchaseRequestRepo, purchaseOrderRepo, materialRepo,
  );

  const addPurchaseRequest = (data: Parameters<typeof purchaseRequestRepo.create>[0]) =>
    run(async () => {
      const pr = await purchaseRequestRepo.create(data);
      addToCache(pr);
      return pr;
    });

  const addPurchaseRequests = (data: Parameters<typeof purchaseRequestRepo.create>[0][]) =>
    run(async () => {
      const created = await purchaseRequestRepo.createMany(data);
      for (const pr of created) {
        addToCache(pr);
      }
      return created;
    });

  const updatePurchaseRequest = (id: string, data: Parameters<typeof purchaseRequestRepo.update>[1]) =>
    run(async () => {
      const updated = await purchaseRequestRepo.update(id, data);
      updateInCache(id, updated);
      return updated;
    });

  const deletePurchaseRequest = (id: string) =>
    run(async () => {
      await purchaseRequestRepo.delete(id);
      removeFromCache(id);
    });

  const convertRequestsToPO = async (prIds: string[], supplierId: string): Promise<PurchaseOrder[]> => {
    const asyncResult = await run(async () => {
      const result = await convertRequestsToPOUseCase.execute({ prIds, supplierId });
      if (!result.ok) throw result.error;

      for (const po of result.value.purchaseOrders) {
        addPurchaseOrderToCache(po);
      }
      for (const request of result.value.updatedRequests) {
        updateInCache(request.id, request);
      }
      return result.value.purchaseOrders;
    });
    return asyncResult.ok ? asyncResult.value : [];
  };

  return {
    purchaseRequests,
    addPurchaseRequest, addPurchaseRequests, updatePurchaseRequest,
    deletePurchaseRequest,
    convertRequestsToPO,
    isLoading, error,
  };
}
