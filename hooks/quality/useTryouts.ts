'use client';

import { useERPStore } from '@/store';
import { getTryoutRepository } from '@/infrastructure/di/container';

export function useTryouts() {
  const tryouts = useERPStore((s) => s.tryouts);
  const addToCache = useERPStore((s) => s.addTryoutToCache);
  const updateInCache = useERPStore((s) => s.updateTryoutInCache);

  const repo = getTryoutRepository();

  const addTryout = async (data: Parameters<typeof repo.create>[0]) => {
    const tryout = await repo.create(data);
    addToCache(tryout);
    return tryout;
  };

  const updateTryout = async (id: string, data: Parameters<typeof repo.update>[1]) => {
    const updated = await repo.update(id, data);
    updateInCache(id, updated);
    return updated;
  };

  return { tryouts, addTryout, updateTryout };
}
