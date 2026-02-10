'use client';

import { useERPStore } from '@/store';
import {
  getPaymentRepository,
  getOrderRepository,
  getGLAccountRepository,
  getJournalEntryRepository,
  getAROpenItemRepository,
  getAPOpenItemRepository,
  getAccountingEventRepository,
} from '@/infrastructure/di/container';
import { PostPaymentConfirmedAccountingUseCase } from '@/domain/sales/use-cases/post-payment-confirmed-accounting';

export function usePayments() {
  const payments = useERPStore((s) => s.payments);
  const addToCache = useERPStore((s) => s.addPaymentToCache);
  const updateInCache = useERPStore((s) => s.updatePaymentInCache);
  const removeFromCache = useERPStore((s) => s.removePaymentFromCache);
  // Accounting cache
  const addJournalEntryToCache = useERPStore((s) => s.addJournalEntryToCache);
  const addAccountingEventToCache = useERPStore((s) => s.addAccountingEventToCache);
  const updateAROpenItemInCache = useERPStore((s) => s.updateAROpenItemInCache);

  const repo = getPaymentRepository();
  const postPaymentConfirmedAccountingUseCase = new PostPaymentConfirmedAccountingUseCase(
    getOrderRepository(),
    getGLAccountRepository(),
    getJournalEntryRepository(),
    getAROpenItemRepository(),
    getAPOpenItemRepository(),
    getAccountingEventRepository(),
  );

  const addPayment = async (data: Parameters<typeof repo.create>[0]) => {
    const payment = await repo.create(data);
    addToCache(payment);
    return payment;
  };

  const updatePayment = async (id: string, data: Parameters<typeof repo.update>[1]) => {
    const updated = await repo.update(id, data);
    updateInCache(id, updated);

    const accountingResult = await postPaymentConfirmedAccountingUseCase.execute(updated);
    if (accountingResult.ok && accountingResult.value) {
      addJournalEntryToCache(accountingResult.value.journalEntry);
      addAccountingEventToCache(accountingResult.value.event);
      if (accountingResult.value.arItem) {
        updateAROpenItemInCache(accountingResult.value.arItem.id, accountingResult.value.arItem);
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
