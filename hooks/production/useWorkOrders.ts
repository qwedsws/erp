'use client';

import { useERPStore } from '@/store';
import { getWorkOrderRepository } from '@/infrastructure/di/container';

export function useWorkOrders() {
  const workOrders = useERPStore((s) => s.workOrders);
  const addToCache = useERPStore((s) => s.addWorkOrderToCache);
  const updateInCache = useERPStore((s) => s.updateWorkOrderInCache);

  const repo = getWorkOrderRepository();

  const addWorkOrder = async (data: Parameters<typeof repo.create>[0]) => {
    const wo = await repo.create(data);
    addToCache(wo);
    return wo;
  };

  const updateWorkOrder = async (id: string, data: Parameters<typeof repo.update>[1]) => {
    const updated = await repo.update(id, data);
    updateInCache(id, updated);
    return updated;
  };

  const startWorkOrder = async (id: string) => {
    return updateWorkOrder(id, {
      status: 'IN_PROGRESS',
      actual_start: new Date().toISOString(),
    });
  };

  const completeWorkOrder = async (id: string) => {
    return updateWorkOrder(id, {
      status: 'COMPLETED',
      actual_end: new Date().toISOString(),
    });
  };

  return {
    workOrders,
    addWorkOrder,
    updateWorkOrder,
    startWorkOrder,
    completeWorkOrder,
  };
}
