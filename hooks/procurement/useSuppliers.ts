'use client';

import { useERPStore } from '@/store';
import { getSupplierRepository } from '@/infrastructure/di/container';

export function useSuppliers() {
  const suppliers = useERPStore((s) => s.suppliers);
  const addToCache = useERPStore((s) => s.addSupplierToCache);
  const updateInCache = useERPStore((s) => s.updateSupplierInCache);
  const removeFromCache = useERPStore((s) => s.removeSupplierFromCache);

  const repo = getSupplierRepository();

  const addSupplier = async (data: Parameters<typeof repo.create>[0]) => {
    const supplier = await repo.create(data);
    addToCache(supplier);
    return supplier;
  };

  const updateSupplier = async (id: string, data: Parameters<typeof repo.update>[1]) => {
    const updated = await repo.update(id, data);
    updateInCache(id, updated);
    return updated;
  };

  const deleteSupplier = async (id: string) => {
    await repo.delete(id);
    removeFromCache(id);
  };

  return { suppliers, addSupplier, updateSupplier, deleteSupplier };
}
