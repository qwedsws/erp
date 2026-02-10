import type { IProjectRepository, IProcessStepRepository } from '@/domain/projects/ports';
import type { Project, ProcessStep } from '@/domain/projects/entities';
import { generateDocumentNo } from '@/domain/shared/types';
import * as sb from '@/lib/supabase/projects';

export class SupabaseProjectRepository implements IProjectRepository {
  async findAll(): Promise<Project[]> {
    return sb.fetchProjects();
  }

  async findById(id: string): Promise<Project | null> {
    return sb.fetchProjectById(id);
  }

  async create(data: Omit<Project, 'id' | 'project_no' | 'created_at' | 'updated_at'>): Promise<Project> {
    const now = new Date().toISOString();
    const MAX_RETRIES = 3;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const id = crypto.randomUUID?.() ?? Math.random().toString(36).substring(2);
      const existing = await sb.fetchProjects();
      const project_no = generateDocumentNo('PJ', existing.map(p => p.project_no));
      const project: Project = { ...data, id, project_no, created_at: now, updated_at: now } as Project;

      try {
        await sb.insertProject(project);
        return project;
      } catch (err) {
        const isConflict = err instanceof Error &&
          (err.message.includes('duplicate') || err.message.includes('unique') || err.message.includes('23505'));
        if (!isConflict || attempt === MAX_RETRIES - 1) {
          throw err;
        }
        continue;
      }
    }

    throw new Error('Failed to generate unique project document number after retries');
  }

  async update(id: string, data: Partial<Project>): Promise<Project> {
    const updated = { ...data, updated_at: new Date().toISOString() };
    await sb.updateProjectDB(id, updated);
    const project = await sb.fetchProjectById(id);
    if (!project) throw new Error(`Project not found after update: ${id}`);
    return project;
  }

  async delete(id: string): Promise<void> {
    await sb.deleteProjectDB(id);
  }
}

export class SupabaseProcessStepRepository implements IProcessStepRepository {
  async findAll(): Promise<ProcessStep[]> {
    return sb.fetchProcessSteps();
  }

  async findByProjectId(projectId: string): Promise<ProcessStep[]> {
    return sb.fetchProcessStepsByProjectId(projectId);
  }

  async create(data: Omit<ProcessStep, 'id' | 'created_at' | 'updated_at'>): Promise<ProcessStep> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID?.() ?? Math.random().toString(36).substring(2);
    const step: ProcessStep = { ...data, id, created_at: now, updated_at: now } as ProcessStep;
    await sb.insertProcessStep(step);
    return step;
  }

  async createMany(data: Omit<ProcessStep, 'id' | 'created_at' | 'updated_at'>[]): Promise<ProcessStep[]> {
    const now = new Date().toISOString();
    const steps = data.map((d) => ({
      ...d,
      id: crypto.randomUUID?.() ?? Math.random().toString(36).substring(2),
      created_at: now,
      updated_at: now,
    } as ProcessStep));
    await sb.insertProcessSteps(steps);
    return steps;
  }

  async update(id: string, data: Partial<ProcessStep>): Promise<ProcessStep> {
    const updated = { ...data, updated_at: new Date().toISOString() };
    await sb.updateProcessStepDB(id, updated);
    const processStep = await sb.fetchProcessStepById(id);
    if (!processStep) throw new Error(`ProcessStep not found after update: ${id}`);
    return processStep;
  }

  async delete(id: string): Promise<void> {
    await sb.deleteProcessStepDB(id);
  }
}
