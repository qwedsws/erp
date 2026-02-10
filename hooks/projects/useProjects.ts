'use client';

import { useEffect } from 'react';
import { useERPStore } from '@/store';
import { getProjectRepository } from '@/infrastructure/di/container';

let projectsLoaded = false;
let projectsLoadPromise: Promise<void> | null = null;

export function useProjects() {
  const projects = useERPStore((s) => s.projects);
  const setProjects = useERPStore((s) => s.setProjects);
  const addToCache = useERPStore((s) => s.addProjectToCache);
  const updateInCache = useERPStore((s) => s.updateProjectInCache);

  const repo = getProjectRepository();

  // Auto-load projects from repository when store is empty
  useEffect(() => {
    if (projectsLoaded || projectsLoadPromise) return;
    projectsLoadPromise = (async () => {
      try {
        const all = await repo.findAll();
        setProjects(all);
        projectsLoaded = true;
      } catch (err) {
        console.error('Failed to load projects:', err);
      } finally {
        projectsLoadPromise = null;
      }
    })();
  }, [repo, setProjects]);

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
