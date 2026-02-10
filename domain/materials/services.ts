import type { Material } from './entities';
import type { IMaterialRepository } from './ports';

// Density table used for theoretical steel weight calculation (g/cm3).
export const STEEL_GRADE_DENSITY: Record<string, number> = {
  NAK80: 7.85,
  SKD11: 7.7,
  SKD61: 7.76,
  S45C: 7.85,
  SUS304: 7.93,
  SCM440: 7.85,
  P20: 7.85,
  STAVAX: 7.8,
  HPM38: 7.81,
  DC53: 7.87,
  AL6061: 2.71,
  AL7075: 2.81,
  AL5052: 2.68,
  AL2024: 2.78,
  C1100: 8.94,
  C2801: 8.5,
  SUS420J2: 7.75,
  SUS440C: 7.7,
};

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
