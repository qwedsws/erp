'use client';

import { useERPStore } from '@/store';
import {
  getGLAccountRepository,
  getJournalEntryRepository,
  getAROpenItemRepository,
  getAPOpenItemRepository,
  getAccountingEventRepository,
} from '@/infrastructure/di/container';
import { PostAccountingEventUseCase, type PostAccountingEventInput } from '@/domain/accounting/use-cases/post-accounting-event';
import { useAsyncAction } from '@/hooks/shared/useAsyncAction';

export function useJournalEntries() {
  const journalEntries = useERPStore((s) => s.journalEntries);
  const addJournalEntryToCache = useERPStore((s) => s.addJournalEntryToCache);
  const addAROpenItemToCache = useERPStore((s) => s.addAROpenItemToCache);
  const updateAROpenItemInCache = useERPStore((s) => s.updateAROpenItemInCache);
  const addAPOpenItemToCache = useERPStore((s) => s.addAPOpenItemToCache);
  const addAccountingEventToCache = useERPStore((s) => s.addAccountingEventToCache);
  const { run, isLoading, error } = useAsyncAction();

  const useCase = new PostAccountingEventUseCase(
    getGLAccountRepository(),
    getJournalEntryRepository(),
    getAROpenItemRepository(),
    getAPOpenItemRepository(),
    getAccountingEventRepository(),
  );

  const postAccountingEvent = (input: PostAccountingEventInput) =>
    run(async () => {
      const result = await useCase.execute(input);
      if (!result.ok) throw result.error;

      addJournalEntryToCache(result.value.journalEntry);
      addAccountingEventToCache(result.value.event);
      if (result.value.arItem) {
        // Check if this is an update (PAYMENT_CONFIRMED) or new
        if (input.event_type === 'PAYMENT_CONFIRMED' && input.payload.order_id) {
          updateAROpenItemInCache(result.value.arItem.id, result.value.arItem);
        } else {
          addAROpenItemToCache(result.value.arItem);
        }
      }
      if (result.value.apItem) {
        addAPOpenItemToCache(result.value.apItem);
      }
      return result.value;
    });

  return { journalEntries, postAccountingEvent, isLoading, error };
}
