'use client';

import { useERPStore } from '@/store';
import { getSteelTagRepository } from '@/infrastructure/di/container';
import {
  getAvailableSteelTagActions,
  type SteelTagAction,
  type TransitionSteelTagStatusInput,
  TransitionSteelTagStatusUseCase,
} from '@/domain/materials/use-cases/transition-steel-tag-status';
import type { SteelTagStatus } from '@/domain/materials/entities';
import { useAsyncAction } from '@/hooks/shared/useAsyncAction';

export function useSteelTags() {
  const steelTags = useERPStore((s) => s.steelTags);
  const addToCache = useERPStore((s) => s.addSteelTagToCache);
  const updateInCache = useERPStore((s) => s.updateSteelTagInCache);
  const removeFromCache = useERPStore((s) => s.removeSteelTagFromCache);
  const { run, isLoading, error } = useAsyncAction();

  const repo = getSteelTagRepository();
  const transitionUseCase = new TransitionSteelTagStatusUseCase(repo);

  const addSteelTag = async (data: Parameters<typeof repo.create>[0]) => {
    const tag = await repo.create(data);
    addToCache(tag);
    return tag;
  };

  const updateSteelTag = async (id: string, data: Parameters<typeof repo.update>[1]) => {
    const updated = await repo.update(id, data);
    updateInCache(id, updated);
    return updated;
  };

  const deleteSteelTag = async (id: string) => {
    await repo.delete(id);
    removeFromCache(id);
  };

  const transitionSteelTagStatus = (input: TransitionSteelTagStatusInput) =>
    run(async () => {
      const result = await transitionUseCase.execute(input);
      if (!result.ok) throw result.error;
      updateInCache(input.tagId, result.value.updatedTag);
    });

  const allocateSteelTag = async (tagId: string, projectId: string) => {
    const result = await transitionSteelTagStatus({ tagId, action: 'ALLOCATE', projectId });
    if (!result.ok) throw new Error(result.error);
  };

  const issueSteelTag = async (tagId: string) => {
    const result = await transitionSteelTagStatus({ tagId, action: 'ISSUE' });
    if (!result.ok) throw new Error(result.error);
  };

  const completeSteelTag = async (tagId: string) => {
    const result = await transitionSteelTagStatus({ tagId, action: 'COMPLETE' });
    if (!result.ok) throw new Error(result.error);
  };

  const scrapSteelTag = async (tagId: string) => {
    const result = await transitionSteelTagStatus({ tagId, action: 'SCRAP' });
    if (!result.ok) throw new Error(result.error);
  };

  const getAvailableActions = (status: SteelTagStatus): SteelTagAction[] => {
    return getAvailableSteelTagActions(status);
  };

  return {
    steelTags,
    addSteelTag,
    updateSteelTag,
    deleteSteelTag,
    allocateSteelTag,
    issueSteelTag,
    completeSteelTag,
    scrapSteelTag,
    getAvailableActions,
    isLoading,
    error,
  };
}
