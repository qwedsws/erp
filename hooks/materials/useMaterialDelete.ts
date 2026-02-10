'use client';

import { useState, useCallback } from 'react';
import { getMaterialRepository } from '@/infrastructure/di/container';
import { useERPStore } from '@/store';
import type { Material } from '@/domain/materials/entities';
import type { MaterialDependencies } from '@/domain/materials/ports';

export function useMaterialDelete(options?: { onDeleted?: () => void; onError?: (message: string) => void }) {
  const removeFromCache = useERPStore((s) => s.removeMaterialFromCache);

  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const [dependencies, setDependencies] = useState<MaterialDependencies | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDependencyModalOpen, setIsDependencyModalOpen] = useState(false);

  const requestDelete = useCallback(async (material: Material) => {
    setDeleteTarget(material);
    setIsChecking(true);
    try {
      const repo = getMaterialRepository();
      const deps = await repo.checkDependencies(material.id);
      setDependencies(deps);
      if (deps.hasDependencies) {
        setIsDependencyModalOpen(true);
      } else {
        setIsConfirmOpen(true);
      }
    } catch {
      setDeleteTarget(null);
      options?.onError?.('의존성 확인 중 오류가 발생했습니다.');
    } finally {
      setIsChecking(false);
    }
  }, [options]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const repo = getMaterialRepository();
      await repo.delete(deleteTarget.id);
      removeFromCache(deleteTarget.id);
      setIsConfirmOpen(false);
      setDeleteTarget(null);
      options?.onDeleted?.();
    } catch (err: unknown) {
      setIsConfirmOpen(false);
      // FK constraint violation (code 23503) — re-fetch deps and show modal
      const isFkError = err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === '23503';
      if (isFkError) {
        try {
          const repo = getMaterialRepository();
          const deps = await repo.checkDependencies(deleteTarget.id);
          setDependencies(deps);
          setIsDependencyModalOpen(true);
        } catch {
          options?.onError?.('자재가 다른 데이터에서 사용 중이므로 삭제할 수 없습니다.');
        }
      } else {
        options?.onError?.('자재 삭제 중 오류가 발생했습니다.');
      }
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, removeFromCache, options]);

  const cancelDelete = useCallback(() => {
    setIsConfirmOpen(false);
    setIsDependencyModalOpen(false);
    setDeleteTarget(null);
    setDependencies(null);
  }, []);

  return {
    deleteTarget,
    dependencies,
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
