import type { IProjectRepository, IProcessStepRepository } from '@/domain/projects/ports';
import type { Project, ProcessStep } from '@/domain/projects/entities';
import { generateId, generateDocumentNo } from '@/domain/shared/types';

export class InMemoryProjectRepository implements IProjectRepository {
  private data: Project[] = [];

  async findAll(): Promise<Project[]> {
    return this.data;
  }

  async findById(id: string): Promise<Project | null> {
    return this.data.find(p => p.id === id) ?? null;
  }

  async create(data: Omit<Project, 'id' | 'project_no' | 'created_at' | 'updated_at'>): Promise<Project> {
    const now = new Date().toISOString();
    const project_no = generateDocumentNo('PJ', this.data.map(p => p.project_no));
    const project: Project = { ...data, id: generateId(), project_no, created_at: now, updated_at: now };
    this.data.push(project);
    return project;
  }

  async update(id: string, data: Partial<Project>): Promise<Project> {
    const idx = this.data.findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Project not found: ${id}`);
    this.data[idx] = { ...this.data[idx], ...data, updated_at: new Date().toISOString() };
    return this.data[idx];
  }

  async delete(id: string): Promise<void> {
    this.data = this.data.filter(p => p.id !== id);
  }
}

export class InMemoryProcessStepRepository implements IProcessStepRepository {
  private data: ProcessStep[] = [];

  async findAll(): Promise<ProcessStep[]> {
    return this.data;
  }

  async findByProjectId(projectId: string): Promise<ProcessStep[]> {
    return this.data.filter(ps => ps.project_id === projectId);
  }

  async create(data: Omit<ProcessStep, 'id' | 'created_at' | 'updated_at'>): Promise<ProcessStep> {
    const now = new Date().toISOString();
    const step: ProcessStep = { ...data, id: generateId(), created_at: now, updated_at: now };
    this.data.push(step);
    return step;
  }

  async createMany(data: Omit<ProcessStep, 'id' | 'created_at' | 'updated_at'>[]): Promise<ProcessStep[]> {
    const now = new Date().toISOString();
    const steps = data.map((d) => ({
      ...d,
      id: generateId(),
      created_at: now,
      updated_at: now,
    } as ProcessStep));
    this.data.push(...steps);
    return steps;
  }

  async update(id: string, data: Partial<ProcessStep>): Promise<ProcessStep> {
    const idx = this.data.findIndex(ps => ps.id === id);
    if (idx === -1) throw new Error(`ProcessStep not found: ${id}`);
    this.data[idx] = { ...this.data[idx], ...data, updated_at: new Date().toISOString() };
    return this.data[idx];
  }

  async delete(id: string): Promise<void> {
    this.data = this.data.filter(ps => ps.id !== id);
  }
}
