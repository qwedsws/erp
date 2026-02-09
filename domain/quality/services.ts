import type { QualityInspection, Tryout, Defect } from './entities';
import type { IInspectionRepository, ITryoutRepository, IDefectRepository } from './ports';

export class InspectionService {
  constructor(private readonly inspectionRepo: IInspectionRepository) {}

  async getAll(): Promise<QualityInspection[]> {
    return this.inspectionRepo.findAll();
  }

  async getById(id: string): Promise<QualityInspection | null> {
    return this.inspectionRepo.findById(id);
  }

  async create(data: Omit<QualityInspection, 'id' | 'inspection_no' | 'created_at' | 'updated_at'>): Promise<QualityInspection> {
    return this.inspectionRepo.create(data);
  }

  async update(id: string, data: Partial<QualityInspection>): Promise<QualityInspection> {
    return this.inspectionRepo.update(id, data);
  }
}

export class TryoutService {
  constructor(private readonly tryoutRepo: ITryoutRepository) {}

  async getAll(): Promise<Tryout[]> {
    return this.tryoutRepo.findAll();
  }

  async getById(id: string): Promise<Tryout | null> {
    return this.tryoutRepo.findById(id);
  }

  async create(data: Omit<Tryout, 'id' | 'created_at' | 'updated_at'>): Promise<Tryout> {
    return this.tryoutRepo.create(data);
  }

  async update(id: string, data: Partial<Tryout>): Promise<Tryout> {
    return this.tryoutRepo.update(id, data);
  }
}

export class DefectService {
  constructor(private readonly defectRepo: IDefectRepository) {}

  async getAll(): Promise<Defect[]> {
    return this.defectRepo.findAll();
  }

  async getById(id: string): Promise<Defect | null> {
    return this.defectRepo.findById(id);
  }

  async create(data: Omit<Defect, 'id' | 'created_at' | 'updated_at'>): Promise<Defect> {
    return this.defectRepo.create(data);
  }

  async update(id: string, data: Partial<Defect>): Promise<Defect> {
    return this.defectRepo.update(id, data);
  }
}
