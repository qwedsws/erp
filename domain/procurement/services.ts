import type { Supplier } from './entities';
import type { ISupplierRepository } from './ports';

export class SupplierService {
  constructor(private readonly supplierRepo: ISupplierRepository) {}

  async getAll(): Promise<Supplier[]> {
    return this.supplierRepo.findAll();
  }

  async getById(id: string): Promise<Supplier | null> {
    return this.supplierRepo.findById(id);
  }

  async create(data: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
    return this.supplierRepo.create(data);
  }

  async update(id: string, data: Partial<Supplier>): Promise<Supplier> {
    return this.supplierRepo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.supplierRepo.delete(id);
  }
}
