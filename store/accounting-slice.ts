import type { StateCreator } from 'zustand';
import type { GLAccount, JournalEntry, AROpenItem, APOpenItem, AccountingEvent } from '@/domain/accounting/entities';
import { mockGLAccounts, mockJournalEntries, mockAROpenItems, mockAPOpenItems, mockAccountingEvents } from '@/lib/mock-accounting-data';

export interface AccountingSlice {
  glAccounts: GLAccount[];
  journalEntries: JournalEntry[];
  arOpenItems: AROpenItem[];
  apOpenItems: APOpenItem[];
  accountingEvents: AccountingEvent[];

  setGLAccounts: (accounts: GLAccount[]) => void;
  setJournalEntries: (entries: JournalEntry[]) => void;
  addJournalEntryToCache: (entry: JournalEntry) => void;
  setAROpenItems: (items: AROpenItem[]) => void;
  addAROpenItemToCache: (item: AROpenItem) => void;
  updateAROpenItemInCache: (id: string, data: Partial<AROpenItem>) => void;
  setAPOpenItems: (items: APOpenItem[]) => void;
  addAPOpenItemToCache: (item: APOpenItem) => void;
  updateAPOpenItemInCache: (id: string, data: Partial<APOpenItem>) => void;
  setAccountingEvents: (events: AccountingEvent[]) => void;
  addAccountingEventToCache: (event: AccountingEvent) => void;
}

export const createAccountingSlice: StateCreator<AccountingSlice, [], [], AccountingSlice> = (set) => ({
  glAccounts: mockGLAccounts,
  journalEntries: mockJournalEntries,
  arOpenItems: mockAROpenItems,
  apOpenItems: mockAPOpenItems,
  accountingEvents: mockAccountingEvents,

  setGLAccounts: (accounts) => set({ glAccounts: accounts }),
  setJournalEntries: (entries) => set({ journalEntries: entries }),
  addJournalEntryToCache: (entry) => set((s) => ({ journalEntries: [...s.journalEntries, entry] })),
  setAROpenItems: (items) => set({ arOpenItems: items }),
  addAROpenItemToCache: (item) => set((s) => ({ arOpenItems: [...s.arOpenItems, item] })),
  updateAROpenItemInCache: (id, data) =>
    set((s) => ({
      arOpenItems: s.arOpenItems.map((a) => (a.id === id ? { ...a, ...data } : a)),
    })),
  setAPOpenItems: (items) => set({ apOpenItems: items }),
  addAPOpenItemToCache: (item) => set((s) => ({ apOpenItems: [...s.apOpenItems, item] })),
  updateAPOpenItemInCache: (id, data) =>
    set((s) => ({
      apOpenItems: s.apOpenItems.map((a) => (a.id === id ? { ...a, ...data } : a)),
    })),
  setAccountingEvents: (events) => set({ accountingEvents: events }),
  addAccountingEventToCache: (event) => set((s) => ({ accountingEvents: [...s.accountingEvents, event] })),
});
