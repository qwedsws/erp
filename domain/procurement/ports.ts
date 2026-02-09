import type { Supplier, PurchaseOrder, PurchaseRequest } from './entities';

export interface ISupplierRepository {
  findAll(): Promise<Supplier[]>;
  findById(id: string): Promise<Supplier | null>;
  create(data: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier>;
  update(id: string, data: Partial<Supplier>): Promise<Supplier>;
  delete(id: string): Promise<void>;
}

export interface IPurchaseOrderRepository {
  findAll(): Promise<PurchaseOrder[]>;
  findById(id: string): Promise<PurchaseOrder | null>;
  create(data: Omit<PurchaseOrder, 'id' | 'po_no' | 'created_at' | 'updated_at'>): Promise<PurchaseOrder>;
  update(id: string, data: Partial<PurchaseOrder>): Promise<PurchaseOrder>;
  delete(id: string): Promise<void>;
}

export interface IPurchaseRequestRepository {
  findAll(): Promise<PurchaseRequest[]>;
  findById(id: string): Promise<PurchaseRequest | null>;
  create(data: Omit<PurchaseRequest, 'id' | 'pr_no' | 'created_at' | 'updated_at'>): Promise<PurchaseRequest>;
  update(id: string, data: Partial<PurchaseRequest>): Promise<PurchaseRequest>;
  delete(id: string): Promise<void>;
}
