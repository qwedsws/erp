'use client';

import { useState, useCallback } from 'react';
import { getMaterialRepository } from '@/infrastructure/di/container';
import { useERPStore } from '@/store';
import type { Material } from '@/domain/materials/entities';
import type { MaterialDependencies } from '@/domain/materials/ports';

export interface BlockedItem {
  material: Material;
  dependencies: MaterialDependencies;
}

export function useMaterialDelete(options?: { onDeleted?: (count: number) => void; onError?: (message: string) => void }) {
  const removeFromCache = useERPStore((s) => s.removeMaterialFromCache);

  const [deleteTargets, setDeleteTargets] = useState<Material[]>([]);
  const [blockedItems, setBlockedItems] = useState<BlockedItem[]>([]);
  const [deletableTargets, setDeletableTargets] = useState<Material[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDependencyModalOpen, setIsDependencyModalOpen] = useState(false);

  const requestDelete = useCallback(async (input: Material | Material[]) => {
    const materials = Array.isArray(input) ? input : [input];
    if (materials.length === 0) return;

    setDeleteTargets(materials);
    setIsChecking(true);
    try {
      const repo = getMaterialRepository();
      const results = await Promise.all(
        materials.map(async (m) => {
          const deps = await repo.checkDependencies(m.id);
          return { material: m, deps };
        }),
      );

      const blocked: BlockedItem[] = [];
      const deletable: Material[] = [];
      for (const { material, deps } of results) {
        if (deps.hasDependencies) {
          blocked.push({ material, dependencies: deps });
        } else {
          deletable.push(material);
        }
      }

      setBlockedItems(blocked);
      setDeletableTargets(deletable);

      if (blocked.length > 0) {
        setIsDependencyModalOpen(true);
      } else {
        setIsConfirmOpen(true);
      }
    } catch {
      setDeleteTargets([]);
      options?.onError?.('의존성 확인 중 오류가 발생했습니다.');
    } finally {
      setIsChecking(false);
    }
  }, [options]);

  const confirmDelete = useCallback(async () => {
    const targets = deletableTargets.length > 0 ? deletableTargets : deleteTargets;
    if (targets.length === 0) return;

    setIsDeleting(true);
    try {
      const repo = getMaterialRepository();
      let deletedCount = 0;
      for (const material of targets) {
        try {
          await repo.delete(material.id);
          removeFromCache(material.id);
          deletedCount++;
        } catch (err: unknown) {
          const isFkError = err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === '23503';
          if (isFkError) {
            // FK constraint — skip this item, it has hidden deps
          } else {
            throw err;
          }
        }
      }
      setIsConfirmOpen(false);
      setDeleteTargets([]);
      setDeletableTargets([]);
      setBlockedItems([]);
      if (deletedCount > 0) {
        options?.onDeleted?.(deletedCount);
      }
    } catch {
      setIsConfirmOpen(false);
      options?.onError?.('자재 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTargets, deletableTargets, removeFromCache, options]);

  const cancelDelete = useCallback(() => {
    setIsConfirmOpen(false);
    setIsDependencyModalOpen(false);
    setDeleteTargets([]);
    setDeletableTargets([]);
    setBlockedItems([]);
  }, []);

  return {
    deleteTargets,
    blockedItems,
    deletableTargets,
    isChecking,
    isDeleting,
    isConfirmOpen,
    isDependencyModalOpen,
    requestDelete,
    confirmDelete,
    cancelDelete,
    setIsConfirmOpen,
    setIsDependencyModalOpen,
  };
}
