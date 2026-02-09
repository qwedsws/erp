'use client';

import { useERPStore } from '@/store';
import { getProjectRepository } from '@/infrastructure/di/container';

export function useProjects() {
  const projects = useERPStore((s) => s.projects);
  const addToCache = useERPStore((s) => s.addProjectToCache);
  const updateInCache = useERPStore((s) => s.updateProjectInCache);

  const repo = getProjectRepository();

  const addProject = async (data: Parameters<typeof repo.create>[0]) => {
    const project = await repo.create(data);
    addToCache(project);
    return project;
  };

  const updateProject = async (id: string, data: Parameters<typeof repo.update>[1]) => {
    const updated = await repo.update(id, data);
    updateInCache(id, updated);
    return updated;
  };

  return { projects, addProject, updateProject };
}
