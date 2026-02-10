import type { StateCreator } from 'zustand';
import type { Project, ProcessStep } from '@/domain/projects/entities';

export interface ProjectsSlice {
  projects: Project[];
  processSteps: ProcessStep[];

  // Cache setters
  setProjects: (projects: Project[]) => void;
  addProjectToCache: (p: Project) => void;
  updateProjectInCache: (id: string, data: Partial<Project>) => void;

  setProcessSteps: (steps: ProcessStep[]) => void;
  addProcessStepToCache: (s: ProcessStep) => void;
  updateProcessStepInCache: (id: string, data: Partial<ProcessStep>) => void;
  removeProcessStepFromCache: (id: string) => void;
}

export const createProjectsSlice: StateCreator<ProjectsSlice, [], [], ProjectsSlice> = (set) => ({
  projects: [],
  processSteps: [],

  setProjects: (projects) => set({ projects }),
  addProjectToCache: (p) => set((s) => ({ projects: [...s.projects, p] })),
  updateProjectInCache: (id, data) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),

  setProcessSteps: (steps) => set({ processSteps: steps }),
  addProcessStepToCache: (step) =>
    set((s) => ({ processSteps: [...s.processSteps, step] })),
  updateProcessStepInCache: (id, data) =>
    set((s) => ({
      processSteps: s.processSteps.map((ps) => (ps.id === id ? { ...ps, ...data } : ps)),
    })),
  removeProcessStepFromCache: (id) =>
    set((s) => ({ processSteps: s.processSteps.filter((ps) => ps.id !== id) })),
});
