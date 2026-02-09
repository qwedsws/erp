import type { Project, ProcessStep } from './entities';
import type { IProjectRepository, IProcessStepRepository } from './ports';

export class ProjectService {
  constructor(private readonly projectRepo: IProjectRepository) {}

  async getAll(): Promise<Project[]> {
    return this.projectRepo.findAll();
  }

  async getById(id: string): Promise<Project | null> {
    return this.projectRepo.findById(id);
  }

  async create(data: Omit<Project, 'id' | 'project_no' | 'created_at' | 'updated_at'>): Promise<Project> {
    return this.projectRepo.create(data);
  }

  async update(id: string, data: Partial<Project>): Promise<Project> {
    return this.projectRepo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.projectRepo.delete(id);
  }
}

export class ProcessStepService {
  constructor(private readonly processStepRepo: IProcessStepRepository) {}

  async getAll(): Promise<ProcessStep[]> {
    return this.processStepRepo.findAll();
  }

  async getByProjectId(projectId: string): Promise<ProcessStep[]> {
    return this.processStepRepo.findByProjectId(projectId);
  }

  async create(data: Omit<ProcessStep, 'id' | 'created_at' | 'updated_at'>): Promise<ProcessStep> {
    return this.processStepRepo.create(data);
  }

  async update(id: string, data: Partial<ProcessStep>): Promise<ProcessStep> {
    return this.processStepRepo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.processStepRepo.delete(id);
  }
}
