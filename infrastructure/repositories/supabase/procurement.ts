import type {
  ISupplierRepository,
  IPurchaseOrderRepository,
  IPurchaseRequestRepository,
} from '@/domain/procurement/ports';
import type { Supplier, PurchaseOrder, PurchaseRequest } from '@/domain/procurement/entities';
import type { QueryRangeOptions, SupplierPageQuery, PurchaseOrderPageQuery, PurchaseRequestPageQuery, PageResult } from '@/domain/shared/types';
import * as sb from '@/lib/supabase/materials';

export class SupabaseSupplierRepository implements ISupplierRepository {
  async findAll(options?: QueryRangeOptions): Promise<Supplier[]> {
    return sb.fetchSuppliers(options);
  }

  async findById(id: string): Promise<Supplier | null> {
    return sb.fetchSupplierById(id);
  }

  async create(input: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID?.() ?? Math.random().toString(36).substring(2);
    const supplier: Supplier = { ...input, id, created_at: now, updated_at: now } as Supplier;
    await sb.insertSupplier(supplier);
    return supplier;
  }

  async update(id: string, data: Partial<Supplier>): Promise<Supplier> {
    const updated = { ...data, updated_at: new Date().toISOString() };
    await sb.updateSupplierDB(id, updated);
    const supplier = await sb.fetchSupplierById(id);
    if (!supplier) throw new Error(`Supplier not found after update: ${id}`);
    return supplier;
  }

  async delete(id: string): Promise<void> {
    await sb.deleteSupplierDB(id);
  }

  async findPage(query: SupplierPageQuery): Promise<PageResult<Supplier>> {
    return sb.fetchSuppliersPage(query);
  }
}

export class SupabasePurchaseOrderRepository implements IPurchaseOrderRepository {
  async findAll(options?: QueryRangeOptions): Promise<PurchaseOrder[]> {
    return sb.fetchPurchaseOrders(options);
  }

  async findPage(query: PurchaseOrderPageQuery): Promise<PageResult<PurchaseOrder>> {
    return sb.fetchPurchaseOrdersPage(query);
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    return sb.fetchPurchaseOrderById(id);
  }

  async create(input: Omit<PurchaseOrder, 'id' | 'po_no' | 'created_at' | 'updated_at'>): Promise<PurchaseOrder> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID?.() ?? Math.random().toString(36).substring(2);
    const po_no = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
    const po: PurchaseOrder = { ...input, id, po_no, created_at: now, updated_at: now } as PurchaseOrder;
    await sb.insertPurchaseOrder(po);
    return po;
  }

  async update(id: string, data: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    const updated = { ...data, updated_at: new Date().toISOString() };
    await sb.updatePurchaseOrderDB(id, updated);
    const purchaseOrder = await sb.fetchPurchaseOrderById(id);
    if (!purchaseOrder) throw new Error(`PurchaseOrder not found after update: ${id}`);
    return purchaseOrder;
  }

  async delete(id: string): Promise<void> {
    await sb.deletePurchaseOrderDB(id);
  }
}

export class SupabasePurchaseRequestRepository implements IPurchaseRequestRepository {
  async findAll(options?: QueryRangeOptions): Promise<PurchaseRequest[]> {
    return sb.fetchPurchaseRequests(options);
  }

  async findPage(query: PurchaseRequestPageQuery): Promise<PageResult<PurchaseRequest>> {
    return sb.fetchPurchaseRequestsPage(query);
  }

  async findById(id: string): Promise<PurchaseRequest | null> {
    return sb.fetchPurchaseRequestById(id);
  }

  async findByIds(ids: string[]): Promise<PurchaseRequest[]> {
    return sb.fetchPurchaseRequestsByIds(ids);
  }

  async create(input: Omit<PurchaseRequest, 'id' | 'pr_no' | 'created_at' | 'updated_at'>): Promise<PurchaseRequest> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID?.() ?? Math.random().toString(36).substring(2);
    const pr_no = `PR-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
    const pr: PurchaseRequest = { ...input, id, pr_no, created_at: now, updated_at: now } as PurchaseRequest;
    await sb.insertPurchaseRequest(pr);
    return pr;
  }

  async createMany(input: Omit<PurchaseRequest, 'id' | 'pr_no' | 'created_at' | 'updated_at'>[]): Promise<PurchaseRequest[]> {
    const now = new Date().toISOString();
    const year = new Date().getFullYear();
    const seed = Date.now();
    const prs = input.map((item, index) => {
      const id = crypto.randomUUID?.() ?? Math.random().toString(36).substring(2);
      const pr_no = `PR-${year}-${String(seed + index).slice(-6)}`;
      return { ...item, id, pr_no, created_at: now, updated_at: now } as PurchaseRequest;
    });
    await sb.insertPurchaseRequests(prs);
    return prs;
  }

  async update(id: string, data: Partial<PurchaseRequest>): Promise<PurchaseRequest> {
    const updated = { ...data, updated_at: new Date().toISOString() };
    await sb.updatePurchaseRequestDB(id, updated);
    const purchaseRequest = await sb.fetchPurchaseRequestById(id);
    if (!purchaseRequest) throw new Error(`PurchaseRequest not found after update: ${id}`);
    return purchaseRequest;
  }

  async delete(id: string): Promise<void> {
    await sb.deletePurchaseRequestDB(id);
  }
}
