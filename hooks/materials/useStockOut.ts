'use client';

import { useStocks } from './useStocks';

export function useStockOut() {
  const { stockOut, isLoading, error } = useStocks({
    includeStocks: false,
    includeMovements: false,
  });
  return { stockOut, isLoading, error };
}
