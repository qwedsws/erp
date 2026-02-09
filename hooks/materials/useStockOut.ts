'use client';

import { useStocks } from './useStocks';

export function useStockOut() {
  const { stockOut, isLoading, error } = useStocks();
  return { stockOut, isLoading, error };
}
