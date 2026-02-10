'use client';

import { useEffect } from 'react';
import { useERPStore } from '@/store';
import {
  getMaterialRepository,
  getPurchaseOrderRepository,
  getPurchaseRequestRepository,
} from '@/infrastructure/di/container';
import { ConvertRequestsToPOUseCase } from '@/domain/procurement/use-cases/convert-requests-to-po';
import { resolveApproverId } from '@/domain/procurement/services';
import type { PurchaseOrder } from '@/domain/procurement/entities';
import { useAsyncAction } from '@/hooks/shared/useAsyncAction';
import { useInitialHydration } from '@/hooks/admin/useInitialHydration';

export function usePurchaseRequests() {
  const purchaseRequests = useERPStore((s) => s.purchaseRequests);
  const profiles = useERPStore((s) => s.profiles);
  const addToCache = useERPStore((s) => s.addPurchaseRequestToCache);
  const updateInCache = useERPStore((s) => s.updatePurchaseRequestInCache);
  const addPurchaseOrderToCache = useERPStore((s) => s.addPurchaseOrderToCache);
  const { run, isLoading, error } = useAsyncAction();
  const { hydrateResources, isResourceHydrated } = useInitialHydration();

  useEffect(() => {
    if (isResourceHydrated('purchaseRequests')) return;
    void hydrateResources([{ resource: 'purchaseRequests' }]);
  }, [hydrateResources, isResourceHydrated]);

  const purchaseRequestRepo = getPurchaseRequestRepository();
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

  const approvePurchaseRequest = (id: string, approvedBy?: string) =>
    run(async () => {
      const approverId = resolveApproverId(profiles, approvedBy);
      const now = new Date().toISOString();
      const updated = await purchaseRequestRepo.update(id, {
        status: 'APPROVED', approved_by: approverId, approved_at: now,
      });
      updateInCache(id, updated);
    });

  const rejectPurchaseRequest = (id: string, reason: string, approvedBy?: string) =>
    run(async () => {
      const approverId = resolveApproverId(profiles, approvedBy);
      const now = new Date().toISOString();
      const updated = await purchaseRequestRepo.update(id, {
        status: 'REJECTED', approved_by: approverId, approved_at: now, reject_reason: reason,
      });
      updateInCache(id, updated);
    });

  const convertRequestsToPO = async (prIds: string[], supplierId: string): Promise<PurchaseOrder | null> => {
    const asyncResult = await run(async () => {
      const result = await convertRequestsToPOUseCase.execute({ prIds, supplierId });
      if (!result.ok) throw result.error;

      addPurchaseOrderToCache(result.value.purchaseOrder);
      for (const request of result.value.updatedRequests) {
        updateInCache(request.id, request);
      }
      return result.value.purchaseOrder;
    });
    return asyncResult.ok ? asyncResult.value : null;
  };

  return {
    purchaseRequests,
    addPurchaseRequest, addPurchaseRequests, updatePurchaseRequest,
    approvePurchaseRequest, rejectPurchaseRequest,
    convertRequestsToPO,
    isLoading, error,
  };
}
