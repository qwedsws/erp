import type { QualityInspection, Tryout, Defect } from './entities';

export interface IInspectionRepository {
  findAll(): Promise<QualityInspection[]>;
  findById(id: string): Promise<QualityInspection | null>;
  create(data: Omit<QualityInspection, 'id' | 'inspection_no' | 'created_at' | 'updated_at'>): Promise<QualityInspection>;
  update(id: string, data: Partial<QualityInspection>): Promise<QualityInspection>;
}

export interface ITryoutRepository {
  findAll(): Promise<Tryout[]>;
  findById(id: string): Promise<Tryout | null>;
  create(data: Omit<Tryout, 'id' | 'created_at' | 'updated_at'>): Promise<Tryout>;
  update(id: string, data: Partial<Tryout>): Promise<Tryout>;
}

export interface IDefectRepository {
  findAll(): Promise<Defect[]>;
  findById(id: string): Promise<Defect | null>;
  create(data: Omit<Defect, 'id' | 'created_at' | 'updated_at'>): Promise<Defect>;
  update(id: string, data: Partial<Defect>): Promise<Defect>;
}
