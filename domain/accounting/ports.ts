import type { GLAccount, JournalEntry, AROpenItem, APOpenItem, AccountingEvent } from './entities';

export interface IGLAccountRepository {
  findAll(): Promise<GLAccount[]>;
  findById(id: string): Promise<GLAccount | null>;
  findByCode(code: string): Promise<GLAccount | null>;
}

export interface IJournalEntryRepository {
  findAll(): Promise<JournalEntry[]>;
  findById(id: string): Promise<JournalEntry | null>;
  findBySourceId(sourceId: string): Promise<JournalEntry[]>;
  create(data: Omit<JournalEntry, 'id' | 'created_at'>): Promise<JournalEntry>;
  update(id: string, data: Partial<JournalEntry>): Promise<JournalEntry>;
}

export interface IAROpenItemRepository {
  findAll(): Promise<AROpenItem[]>;
  findByOrderId(orderId: string): Promise<AROpenItem | null>;
  findByCustomerId(customerId: string): Promise<AROpenItem[]>;
  create(data: Omit<AROpenItem, 'id' | 'created_at' | 'updated_at'>): Promise<AROpenItem>;
  update(id: string, data: Partial<AROpenItem>): Promise<AROpenItem>;
}

export interface IAPOpenItemRepository {
  findAll(): Promise<APOpenItem[]>;
  findByPurchaseOrderId(poId: string): Promise<APOpenItem | null>;
  findBySupplierId(supplierId: string): Promise<APOpenItem[]>;
  create(data: Omit<APOpenItem, 'id' | 'created_at' | 'updated_at'>): Promise<APOpenItem>;
  update(id: string, data: Partial<APOpenItem>): Promise<APOpenItem>;
}

export interface IAccountingEventRepository {
  findAll(): Promise<AccountingEvent[]>;
  findBySourceId(sourceId: string): Promise<AccountingEvent[]>;
  create(data: Omit<AccountingEvent, 'id' | 'created_at'>): Promise<AccountingEvent>;
  update(id: string, data: Partial<AccountingEvent>): Promise<AccountingEvent>;
}
