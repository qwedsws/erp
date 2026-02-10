'use client';

import { useCallback, useEffect } from 'react';
import { useERPStore } from '@/store';
import { getMaterialRepository, getMaterialPriceRepository } from '@/infrastructure/di/container';

let materialsLoaded = false;
let loadPromise: Promise<void> | null = null;

export function useMaterials() {
  const materials = useERPStore((s) => s.materials);
  const materialPrices = useERPStore((s) => s.materialPrices);
  const setMaterials = useERPStore((s) => s.setMaterials);
  const addToCache = useERPStore((s) => s.addMaterialToCache);
  const updateInCache = useERPStore((s) => s.updateMaterialInCache);
  const removeFromCache = useERPStore((s) => s.removeMaterialFromCache);
  const addPriceToCache = useERPStore((s) => s.addMaterialPriceToCache);
  const removePriceFromCache = useERPStore((s) => s.removeMaterialPriceFromCache);

  const repo = getMaterialRepository();
  const priceRepo = getMaterialPriceRepository();

  // Auto-load materials from repository when store is empty
  useEffect(() => {
    if (materialsLoaded || loadPromise) return;
    loadPromise = (async () => {
      try {
        const all = await repo.findAll();
        setMaterials(all);
        materialsLoaded = true;
      } catch (err) {
        console.error('Failed to load materials:', err);
      } finally {
        loadPromise = null;
      }
    })();
  }, [repo, setMaterials]);

  const loadAll = useCallback(async () => {
    const all = await repo.findAll();
    setMaterials(all);
    materialsLoaded = true;
    return all;
  }, [repo, setMaterials]);

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
    loadAll,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    addMaterialPrice,
    deleteMaterialPrice,
  };
}
