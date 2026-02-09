import type { IInspectionRepository, ITryoutRepository, IDefectRepository } from '@/domain/quality/ports';
import type { QualityInspection, Tryout, Defect } from '@/domain/quality/entities';
import { generateId, generateDocumentNo } from '@/domain/shared/types';
import { mockInspections, mockTryouts, mockDefects } from '@/lib/mock-data';

export class InMemoryInspectionRepository implements IInspectionRepository {
  private data: QualityInspection[] = [...mockInspections];

  async findAll(): Promise<QualityInspection[]> {
    return this.data;
  }

  async findById(id: string): Promise<QualityInspection | null> {
    return this.data.find(qi => qi.id === id) ?? null;
  }

  async create(data: Omit<QualityInspection, 'id' | 'inspection_no' | 'created_at' | 'updated_at'>): Promise<QualityInspection> {
    const now = new Date().toISOString();
    const inspection_no = generateDocumentNo('QI', this.data.map(qi => qi.inspection_no));
    const inspection: QualityInspection = { ...data, id: generateId(), inspection_no, created_at: now, updated_at: now };
    this.data.push(inspection);
    return inspection;
  }

  async update(id: string, data: Partial<QualityInspection>): Promise<QualityInspection> {
    const idx = this.data.findIndex(qi => qi.id === id);
    if (idx === -1) throw new Error(`Inspection not found: ${id}`);
    this.data[idx] = { ...this.data[idx], ...data, updated_at: new Date().toISOString() };
    return this.data[idx];
  }
}

export class InMemoryTryoutRepository implements ITryoutRepository {
  private data: Tryout[] = [...mockTryouts];

  async findAll(): Promise<Tryout[]> {
    return this.data;
  }

  async findById(id: string): Promise<Tryout | null> {
    return this.data.find(t => t.id === id) ?? null;
  }

  async create(data: Omit<Tryout, 'id' | 'created_at' | 'updated_at'>): Promise<Tryout> {
    const now = new Date().toISOString();
    const tryout: Tryout = { ...data, id: generateId(), created_at: now, updated_at: now };
    this.data.push(tryout);
    return tryout;
  }

  async update(id: string, data: Partial<Tryout>): Promise<Tryout> {
    const idx = this.data.findIndex(t => t.id === id);
    if (idx === -1) throw new Error(`Tryout not found: ${id}`);
    this.data[idx] = { ...this.data[idx], ...data, updated_at: new Date().toISOString() };
    return this.data[idx];
  }
}

export class InMemoryDefectRepository implements IDefectRepository {
  private data: Defect[] = [...mockDefects];

  async findAll(): Promise<Defect[]> {
    return this.data;
  }

  async findById(id: string): Promise<Defect | null> {
    return this.data.find(d => d.id === id) ?? null;
  }

  async create(data: Omit<Defect, 'id' | 'created_at' | 'updated_at'>): Promise<Defect> {
    const now = new Date().toISOString();
    const defect: Defect = { ...data, id: generateId(), created_at: now, updated_at: now };
    this.data.push(defect);
    return defect;
  }

  async update(id: string, data: Partial<Defect>): Promise<Defect> {
    const idx = this.data.findIndex(d => d.id === id);
    if (idx === -1) throw new Error(`Defect not found: ${id}`);
    this.data[idx] = { ...this.data[idx], ...data, updated_at: new Date().toISOString() };
    return this.data[idx];
  }
}
