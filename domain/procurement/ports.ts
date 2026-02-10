import type { Supplier, PurchaseOrder, PurchaseRequest } from './entities';
import type { QueryRangeOptions } from '@/domain/shared/types';

export interface ISupplierRepository {
  findAll(options?: QueryRangeOptions): Promise<Supplier[]>;
  findById(id: string): Promise<Supplier | null>;
  create(data: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier>;
  update(id: string, data: Partial<Supplier>): Promise<Supplier>;
  delete(id: string): Promise<void>;
}

export interface IPurchaseOrderRepository {
  findAll(options?: QueryRangeOptions): Promise<PurchaseOrder[]>;
  findById(id: string): Promise<PurchaseOrder | null>;
  create(data: Omit<PurchaseOrder, 'id' | 'po_no' | 'created_at' | 'updated_at'>): Promise<PurchaseOrder>;
  update(id: string, data: Partial<PurchaseOrder>): Promise<PurchaseOrder>;
  delete(id: string): Promise<void>;
}

export interface IPurchaseRequestRepository {
  findAll(options?: QueryRangeOptions): Promise<PurchaseRequest[]>;
  findById(id: string): Promise<PurchaseRequest | null>;
  findByIds(ids: string[]): Promise<PurchaseRequest[]>;
  create(data: Omit<PurchaseRequest, 'id' | 'pr_no' | 'created_at' | 'updated_at'>): Promise<PurchaseRequest>;
  createMany(data: Omit<PurchaseRequest, 'id' | 'pr_no' | 'created_at' | 'updated_at'>[]): Promise<PurchaseRequest[]>;
  update(id: string, data: Partial<PurchaseRequest>): Promise<PurchaseRequest>;
  delete(id: string): Promise<void>;
}
