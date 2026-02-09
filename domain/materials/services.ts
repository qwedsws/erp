import type { Material } from './entities';
import type { IMaterialRepository } from './ports';

export class MaterialService {
  constructor(private readonly materialRepo: IMaterialRepository) {}

  async getAll(): Promise<Material[]> {
    return this.materialRepo.findAll();
  }

  async getById(id: string): Promise<Material | null> {
    return this.materialRepo.findById(id);
  }

  async create(data: Omit<Material, 'id' | 'created_at' | 'updated_at'>): Promise<Material> {
    return this.materialRepo.create(data);
  }

  async update(id: string, data: Partial<Material>): Promise<Material> {
    return this.materialRepo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.materialRepo.delete(id);
  }
}
