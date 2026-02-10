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
import type { PurchaseOrder, PurchaseRequest } from '@/domain/procurement/entities';
import { useAsyncAction } from '@/hooks/shared/useAsyncAction';

let prsLoaded = false;
let prsLoadPromise: Promise<void> | null = null;

export function usePurchaseRequests() {
  const purchaseRequests = useERPStore((s) => s.purchaseRequests);
  const setPurchaseRequests = useERPStore((s) => s.setPurchaseRequests);
  const profiles = useERPStore((s) => s.profiles);
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

  const revokePurchaseRequest = (id: string) =>
    run(async () => {
      // null clears Supabase columns; cast needed because entity uses optional (undefined)
      const updated = await purchaseRequestRepo.update(id, {
        status: 'IN_PROGRESS',
        approved_by: null,
        approved_at: null,
        reject_reason: null,
      } as unknown as Partial<PurchaseRequest>);
      updateInCache(id, updated);
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
    approvePurchaseRequest, rejectPurchaseRequest, revokePurchaseRequest, deletePurchaseRequest,
    convertRequestsToPO,
    isLoading, error,
  };
}
