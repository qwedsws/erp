'use client';

import { useERPStore } from '@/store';
import { getPaymentRepository } from '@/infrastructure/di/container';

export function usePayments() {
  const payments = useERPStore((s) => s.payments);
  const addToCache = useERPStore((s) => s.addPaymentToCache);
  const updateInCache = useERPStore((s) => s.updatePaymentInCache);
  const removeFromCache = useERPStore((s) => s.removePaymentFromCache);

  const repo = getPaymentRepository();

  const addPayment = async (data: Parameters<typeof repo.create>[0]) => {
    const payment = await repo.create(data);
    addToCache(payment);
    return payment;
  };

  const updatePayment = async (id: string, data: Parameters<typeof repo.update>[1]) => {
    const updated = await repo.update(id, data);
    updateInCache(id, updated);
    return updated;
  };

  const deletePayment = async (id: string) => {
    await repo.delete(id);
    removeFromCache(id);
  };

  return { payments, addPayment, updatePayment, deletePayment };
}
