'use client';

import { useERPStore } from '@/store';
import { getDefectRepository } from '@/infrastructure/di/container';

export function useDefects() {
  const defects = useERPStore((s) => s.defects);
  const addToCache = useERPStore((s) => s.addDefectToCache);
  const updateInCache = useERPStore((s) => s.updateDefectInCache);

  const repo = getDefectRepository();

  const addDefect = async (data: Parameters<typeof repo.create>[0]) => {
    const defect = await repo.create(data);
    addToCache(defect);
    return defect;
  };

  const updateDefect = async (id: string, data: Parameters<typeof repo.update>[1]) => {
    const updated = await repo.update(id, data);
    updateInCache(id, updated);
    return updated;
  };

  return { defects, addDefect, updateDefect };
}
