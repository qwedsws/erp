'use client';

import { useEffect } from 'react';
import { useERPStore } from '@/store';
import { getMaterialRepository, getMaterialPriceRepository } from '@/infrastructure/di/container';
import { useInitialHydration } from '@/hooks/admin/useInitialHydration';
import type { HydrationRequest } from '@/hooks/admin/useInitialHydration';

interface UseMaterialsOptions {
  includeMaterialPrices?: boolean;
}

export function useMaterials(options?: UseMaterialsOptions) {
  const materials = useERPStore((s) => s.materials);
  const materialPrices = useERPStore((s) => s.materialPrices);
  const addToCache = useERPStore((s) => s.addMaterialToCache);
  const updateInCache = useERPStore((s) => s.updateMaterialInCache);
  const removeFromCache = useERPStore((s) => s.removeMaterialFromCache);
  const addPriceToCache = useERPStore((s) => s.addMaterialPriceToCache);
  const removePriceFromCache = useERPStore((s) => s.removeMaterialPriceFromCache);

  const repo = getMaterialRepository();
  const priceRepo = getMaterialPriceRepository();
  const { hydrateResources, isResourceHydrated } = useInitialHydration();
  const includeMaterialPrices = options?.includeMaterialPrices ?? false;

  useEffect(() => {
    const requests: HydrationRequest[] = [{ resource: 'materials' }];
    if (includeMaterialPrices) {
      requests.push({ resource: 'materialPrices' as const });
    }

    const allHydrated = requests.every((request) => isResourceHydrated(request.resource));
    if (allHydrated) return;

    void hydrateResources(requests);
  }, [hydrateResources, includeMaterialPrices, isResourceHydrated]);

  const addMaterial = async (data: Parameters<typeof repo.create>[0]) => {
    const material = await repo.create(data);
    addToCache(material);
    return material;
  };

  const updateMaterial = async (id: string, data: Parameters<typeof repo.update>[1]) => {
    const updated = await repo.update(id, data);
    updateInCache(id, updated);
    return updated;
  };

  const deleteMaterial = async (id: string) => {
    await repo.delete(id);
    removeFromCache(id);
  };

  const addMaterialPrice = async (data: Parameters<typeof priceRepo.create>[0]) => {
    const price = await priceRepo.create(data);
    addPriceToCache(price);
    return price;
  };

  const deleteMaterialPrice = async (id: string) => {
    await priceRepo.delete(id);
    removePriceFromCache(id);
  };

  return {
    materials,
    materialPrices,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    addMaterialPrice,
    deleteMaterialPrice,
  };
}
