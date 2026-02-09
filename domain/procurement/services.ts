import type { Profile, Supplier } from './entities';
import type { ISupplierRepository } from './ports';

/**
 * Resolves the approver for a purchase request.
 * Policy: if no explicit approver given, pick first active PURCHASE or ADMIN user.
 */
export function resolveApproverId(
  profiles: Pick<Profile, 'id' | 'is_active' | 'role'>[],
  approvedBy?: string,
): string {
  if (approvedBy) return approvedBy;

  const approver = profiles.find(
    (profile) =>
      profile.is_active && (profile.role === 'PURCHASE' || profile.role === 'ADMIN'),
  );

  if (!approver) {
    throw new Error('승인자를 찾을 수 없습니다. 사용자 데이터를 확인하세요.');
  }

  return approver.id;
}

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
