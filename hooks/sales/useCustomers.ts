'use client';

import { useERPStore } from '@/store';
import { getCustomerRepository } from '@/infrastructure/di/container';

export function useCustomers() {
  const customers = useERPStore((s) => s.customers);
  const addToCache = useERPStore((s) => s.addCustomerToCache);
  const updateInCache = useERPStore((s) => s.updateCustomerInCache);
  const removeFromCache = useERPStore((s) => s.removeCustomerFromCache);

  const repo = getCustomerRepository();

  const addCustomer = async (data: Parameters<typeof repo.create>[0]) => {
    const customer = await repo.create(data);
    addToCache(customer);
    return customer;
  };

  const updateCustomer = async (id: string, data: Parameters<typeof repo.update>[1]) => {
    const updated = await repo.update(id, data);
    updateInCache(id, updated);
    return updated;
  };

  const deleteCustomer = async (id: string) => {
    await repo.delete(id);
    removeFromCache(id);
  };

  return { customers, addCustomer, updateCustomer, deleteCustomer };
}
