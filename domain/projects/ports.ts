import type { Project, ProcessStep } from './entities';

export interface IProjectRepository {
  findAll(): Promise<Project[]>;
  findById(id: string): Promise<Project | null>;
  create(data: Omit<Project, 'id' | 'project_no' | 'created_at' | 'updated_at'>): Promise<Project>;
  update(id: string, data: Partial<Project>): Promise<Project>;
  delete(id: string): Promise<void>;
}

export interface IProcessStepRepository {
  findAll(): Promise<ProcessStep[]>;
  findByProjectId(projectId: string): Promise<ProcessStep[]>;
  create(data: Omit<ProcessStep, 'id' | 'created_at' | 'updated_at'>): Promise<ProcessStep>;
  update(id: string, data: Partial<ProcessStep>): Promise<ProcessStep>;
  delete(id: string): Promise<void>;
}
