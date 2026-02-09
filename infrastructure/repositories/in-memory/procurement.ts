import type {
  ISupplierRepository,
  IPurchaseOrderRepository,
  IPurchaseRequestRepository,
} from '@/domain/procurement/ports';
import type { Supplier, PurchaseOrder, PurchaseRequest } from '@/domain/procurement/entities';
import { generateId, generateDocumentNo } from '@/domain/shared/types';
import { mockSuppliers, mockPurchaseOrders, mockPurchaseRequests } from '@/lib/mock-data';

export class InMemorySupplierRepository implements ISupplierRepository {
  private data: Supplier[] = [...mockSuppliers];

  async findAll(): Promise<Supplier[]> {
    return this.data;
  }

  async findById(id: string): Promise<Supplier | null> {
    return this.data.find(s => s.id === id) ?? null;
  }

  async create(data: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
    const now = new Date().toISOString();
    const supplier: Supplier = { ...data, id: generateId(), created_at: now, updated_at: now };
    this.data.push(supplier);
    return supplier;
  }

  async update(id: string, data: Partial<Supplier>): Promise<Supplier> {
    const idx = this.data.findIndex(s => s.id === id);
    if (idx === -1) throw new Error(`Supplier not found: ${id}`);
    this.data[idx] = { ...this.data[idx], ...data, updated_at: new Date().toISOString() };
    return this.data[idx];
  }

  async delete(id: string): Promise<void> {
    this.data = this.data.filter(s => s.id !== id);
  }
}

export class InMemoryPurchaseOrderRepository implements IPurchaseOrderRepository {
  private data: PurchaseOrder[] = [...mockPurchaseOrders];

  async findAll(): Promise<PurchaseOrder[]> {
    return this.data;
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    return this.data.find(po => po.id === id) ?? null;
  }

  async create(data: Omit<PurchaseOrder, 'id' | 'po_no' | 'created_at' | 'updated_at'>): Promise<PurchaseOrder> {
    const now = new Date().toISOString();
    const po_no = generateDocumentNo('PO', this.data.map(po => po.po_no));
    const po: PurchaseOrder = { ...data, id: generateId(), po_no, created_at: now, updated_at: now };
    this.data.push(po);
    return po;
  }

  async update(id: string, data: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    const idx = this.data.findIndex(po => po.id === id);
    if (idx === -1) throw new Error(`PurchaseOrder not found: ${id}`);
    this.data[idx] = { ...this.data[idx], ...data, updated_at: new Date().toISOString() };
    return this.data[idx];
  }

  async delete(id: string): Promise<void> {
    this.data = this.data.filter(po => po.id !== id);
  }
}

export class InMemoryPurchaseRequestRepository implements IPurchaseRequestRepository {
  private data: PurchaseRequest[] = [...mockPurchaseRequests];

  async findAll(): Promise<PurchaseRequest[]> {
    return this.data;
  }

  async findById(id: string): Promise<PurchaseRequest | null> {
    return this.data.find(pr => pr.id === id) ?? null;
  }

  async create(data: Omit<PurchaseRequest, 'id' | 'pr_no' | 'created_at' | 'updated_at'>): Promise<PurchaseRequest> {
    const now = new Date().toISOString();
    const pr_no = generateDocumentNo('PR', this.data.map(pr => pr.pr_no));
    const pr: PurchaseRequest = { ...data, id: generateId(), pr_no, created_at: now, updated_at: now };
    this.data.push(pr);
    return pr;
  }

  async update(id: string, data: Partial<PurchaseRequest>): Promise<PurchaseRequest> {
    const idx = this.data.findIndex(pr => pr.id === id);
    if (idx === -1) throw new Error(`PurchaseRequest not found: ${id}`);
    this.data[idx] = { ...this.data[idx], ...data, updated_at: new Date().toISOString() };
    return this.data[idx];
  }

  async delete(id: string): Promise<void> {
    this.data = this.data.filter(pr => pr.id !== id);
  }
}
