'use client';

import { usePurchaseOrders } from '@/hooks/procurement/usePurchaseOrders';

export function useReceivePO() {
  const { receivePurchaseOrder, isLoading, error } = usePurchaseOrders();
  return { receivePO: receivePurchaseOrder, isLoading, error };
}
