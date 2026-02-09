import type {
  IGLAccountRepository,
  IJournalEntryRepository,
  IAROpenItemRepository,
  IAPOpenItemRepository,
  IAccountingEventRepository,
} from '@/domain/accounting/ports';
import type { GLAccount, JournalEntry, AROpenItem, APOpenItem, AccountingEvent } from '@/domain/accounting/entities';
import { generateId } from '@/domain/shared/types';
import {
  mockGLAccounts,
  mockJournalEntries,
  mockAROpenItems,
  mockAPOpenItems,
  mockAccountingEvents,
} from '@/lib/mock-accounting-data';

export class InMemoryGLAccountRepository implements IGLAccountRepository {
  private data: GLAccount[] = [...mockGLAccounts];

  async findAll(): Promise<GLAccount[]> {
    return this.data;
  }

  async findById(id: string): Promise<GLAccount | null> {
    return this.data.find(a => a.id === id) ?? null;
  }

  async findByCode(code: string): Promise<GLAccount | null> {
    return this.data.find(a => a.code === code) ?? null;
  }
}

export class InMemoryJournalEntryRepository implements IJournalEntryRepository {
  private data: JournalEntry[] = [...mockJournalEntries];

  async findAll(): Promise<JournalEntry[]> {
    return this.data;
  }

  async findById(id: string): Promise<JournalEntry | null> {
    return this.data.find(j => j.id === id) ?? null;
  }

  async findBySourceId(sourceId: string): Promise<JournalEntry[]> {
    return this.data.filter(j => j.source_id === sourceId);
  }

  async create(data: Omit<JournalEntry, 'id' | 'created_at'>): Promise<JournalEntry> {
    const id = generateId();
    const now = new Date().toISOString();
    const entry: JournalEntry = {
      ...data,
      id,
      lines: data.lines.map(l => ({ ...l, journal_entry_id: id })),
      created_at: now,
    };
    this.data.push(entry);
    return entry;
  }

  async update(id: string, data: Partial<JournalEntry>): Promise<JournalEntry> {
    const idx = this.data.findIndex(j => j.id === id);
    if (idx === -1) throw new Error(`JournalEntry not found: ${id}`);
    this.data[idx] = { ...this.data[idx], ...data };
    return this.data[idx];
  }
}

export class InMemoryAROpenItemRepository implements IAROpenItemRepository {
  private data: AROpenItem[] = [...mockAROpenItems];

  async findAll(): Promise<AROpenItem[]> {
    return this.data;
  }

  async findByOrderId(orderId: string): Promise<AROpenItem | null> {
    return this.data.find(a => a.order_id === orderId) ?? null;
  }

  async findByCustomerId(customerId: string): Promise<AROpenItem[]> {
    return this.data.filter(a => a.customer_id === customerId);
  }

  async create(data: Omit<AROpenItem, 'id' | 'created_at' | 'updated_at'>): Promise<AROpenItem> {
    const now = new Date().toISOString();
    const item: AROpenItem = { ...data, id: generateId(), created_at: now, updated_at: now };
    this.data.push(item);
    return item;
  }

  async update(id: string, data: Partial<AROpenItem>): Promise<AROpenItem> {
    const idx = this.data.findIndex(a => a.id === id);
    if (idx === -1) throw new Error(`AROpenItem not found: ${id}`);
    this.data[idx] = { ...this.data[idx], ...data, updated_at: new Date().toISOString() };
    return this.data[idx];
  }
}

export class InMemoryAPOpenItemRepository implements IAPOpenItemRepository {
  private data: APOpenItem[] = [...mockAPOpenItems];

  async findAll(): Promise<APOpenItem[]> {
    return this.data;
  }

  async findByPurchaseOrderId(poId: string): Promise<APOpenItem | null> {
    return this.data.find(a => a.purchase_order_id === poId) ?? null;
  }

  async findBySupplierId(supplierId: string): Promise<APOpenItem[]> {
    return this.data.filter(a => a.supplier_id === supplierId);
  }

  async create(data: Omit<APOpenItem, 'id' | 'created_at' | 'updated_at'>): Promise<APOpenItem> {
    const now = new Date().toISOString();
    const item: APOpenItem = { ...data, id: generateId(), created_at: now, updated_at: now };
    this.data.push(item);
    return item;
  }

  async update(id: string, data: Partial<APOpenItem>): Promise<APOpenItem> {
    const idx = this.data.findIndex(a => a.id === id);
    if (idx === -1) throw new Error(`APOpenItem not found: ${id}`);
    this.data[idx] = { ...this.data[idx], ...data, updated_at: new Date().toISOString() };
    return this.data[idx];
  }
}

export class InMemoryAccountingEventRepository implements IAccountingEventRepository {
  private data: AccountingEvent[] = [...mockAccountingEvents];

  async findAll(): Promise<AccountingEvent[]> {
    return this.data;
  }

  async findBySourceId(sourceId: string): Promise<AccountingEvent[]> {
    return this.data.filter(e => e.source_id === sourceId);
  }

  async create(data: Omit<AccountingEvent, 'id' | 'created_at'>): Promise<AccountingEvent> {
    const now = new Date().toISOString();
    const event: AccountingEvent = { ...data, id: generateId(), created_at: now };
    this.data.push(event);
    return event;
  }

  async update(id: string, data: Partial<AccountingEvent>): Promise<AccountingEvent> {
    const idx = this.data.findIndex(e => e.id === id);
    if (idx === -1) throw new Error(`AccountingEvent not found: ${id}`);
    this.data[idx] = { ...this.data[idx], ...data };
    return this.data[idx];
  }
}
