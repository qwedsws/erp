'use client';

import { useERPStore } from '@/store';
import { getInspectionRepository } from '@/infrastructure/di/container';

export function useInspections() {
  const inspections = useERPStore((s) => s.inspections);
  const addToCache = useERPStore((s) => s.addInspectionToCache);
  const updateInCache = useERPStore((s) => s.updateInspectionInCache);

  const repo = getInspectionRepository();

  const addInspection = async (data: Parameters<typeof repo.create>[0]) => {
    const inspection = await repo.create(data);
    addToCache(inspection);
    return inspection;
  };

  const updateInspection = async (id: string, data: Parameters<typeof repo.update>[1]) => {
    const updated = await repo.update(id, data);
    updateInCache(id, updated);
    return updated;
  };

  return { inspections, addInspection, updateInspection };
}
