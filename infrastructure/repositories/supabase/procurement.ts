import type {
  ISupplierRepository,
  IPurchaseOrderRepository,
  IPurchaseRequestRepository,
} from '@/domain/procurement/ports';
import type { Supplier, PurchaseOrder, PurchaseRequest } from '@/domain/procurement/entities';
import * as sb from '@/lib/supabase/materials';

export class SupabaseSupplierRepository implements ISupplierRepository {
  async findAll(): Promise<Supplier[]> {
    return sb.fetchSuppliers();
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
    return { ...updated, id } as Supplier;
  }

  async delete(id: string): Promise<void> {
    await sb.deleteSupplierDB(id);
  }
}

export class SupabasePurchaseOrderRepository implements IPurchaseOrderRepository {
  async findAll(): Promise<PurchaseOrder[]> {
    return sb.fetchPurchaseOrders();
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
    return { ...updated, id } as PurchaseOrder;
  }

  async delete(id: string): Promise<void> {
    await sb.deletePurchaseOrderDB(id);
  }
}

export class SupabasePurchaseRequestRepository implements IPurchaseRequestRepository {
  async findAll(): Promise<PurchaseRequest[]> {
    return sb.fetchPurchaseRequests();
  }

  async findById(id: string): Promise<PurchaseRequest | null> {
    return sb.fetchPurchaseRequestById(id);
  }

  async create(input: Omit<PurchaseRequest, 'id' | 'pr_no' | 'created_at' | 'updated_at'>): Promise<PurchaseRequest> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID?.() ?? Math.random().toString(36).substring(2);
    const pr_no = `PR-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
    const pr: PurchaseRequest = { ...input, id, pr_no, created_at: now, updated_at: now } as PurchaseRequest;
    await sb.insertPurchaseRequest(pr);
    return pr;
  }

  async update(id: string, data: Partial<PurchaseRequest>): Promise<PurchaseRequest> {
    const updated = { ...data, updated_at: new Date().toISOString() };
    await sb.updatePurchaseRequestDB(id, updated);
    return { ...updated, id } as PurchaseRequest;
  }

  async delete(id: string): Promise<void> {
    // Supabase materials.ts doesn't expose a deletePurchaseRequest function
    // For now, this is a no-op until the Supabase layer adds it
    console.warn(`deletePurchaseRequest not implemented in Supabase layer (id: ${id})`);
  }
}
