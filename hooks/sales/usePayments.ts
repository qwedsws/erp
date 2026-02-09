'use client';

import { useERPStore } from '@/store';
import {
  getPaymentRepository,
  getGLAccountRepository,
  getJournalEntryRepository,
  getAROpenItemRepository,
  getAPOpenItemRepository,
  getAccountingEventRepository,
} from '@/infrastructure/di/container';
import { PostAccountingEventUseCase } from '@/domain/accounting/use-cases/post-accounting-event';

export function usePayments() {
  const payments = useERPStore((s) => s.payments);
  const orders = useERPStore((s) => s.orders);
  const addToCache = useERPStore((s) => s.addPaymentToCache);
  const updateInCache = useERPStore((s) => s.updatePaymentInCache);
  const removeFromCache = useERPStore((s) => s.removePaymentFromCache);
  // Accounting cache
  const addJournalEntryToCache = useERPStore((s) => s.addJournalEntryToCache);
  const addAccountingEventToCache = useERPStore((s) => s.addAccountingEventToCache);
  const updateAROpenItemInCache = useERPStore((s) => s.updateAROpenItemInCache);

  const repo = getPaymentRepository();
  const postAccountingEventUseCase = new PostAccountingEventUseCase(
    getGLAccountRepository(), getJournalEntryRepository(), getAROpenItemRepository(), getAPOpenItemRepository(), getAccountingEventRepository(),
  );

  const addPayment = async (data: Parameters<typeof repo.create>[0]) => {
    const payment = await repo.create(data);
    addToCache(payment);
    return payment;
  };

  const updatePayment = async (id: string, data: Parameters<typeof repo.update>[1]) => {
    const updated = await repo.update(id, data);
    updateInCache(id, updated);

    // Auto-journaling: PAYMENT_CONFIRMED when status becomes CONFIRMED
    if (updated.status === 'CONFIRMED') {
      try {
        const order = orders.find(o => o.id === updated.order_id);
        const postResult = await postAccountingEventUseCase.execute({
          source_type: 'PAYMENT',
          source_id: updated.id,
          source_no: order?.order_no || updated.order_id,
          event_type: 'PAYMENT_CONFIRMED',
          payload: {
            amount: updated.amount,
            customer_id: order?.customer_id || '',
            order_id: updated.order_id,
            order_no: order?.order_no || '',
          },
        });
        if (postResult.ok) {
          addJournalEntryToCache(postResult.value.journalEntry);
          addAccountingEventToCache(postResult.value.event);
          if (postResult.value.arItem) updateAROpenItemInCache(postResult.value.arItem.id, postResult.value.arItem);
        }
      } catch {
        // Silent fail — accounting should not block payment update
      }
    }

    return updated;
  };

  const deletePayment = async (id: string) => {
    await repo.delete(id);
    removeFromCache(id);
  };

  return { payments, addPayment, updatePayment, deletePayment };
}
