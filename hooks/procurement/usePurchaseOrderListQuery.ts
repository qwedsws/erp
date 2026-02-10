'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getPurchaseOrderRepository } from '@/infrastructure/di/container';
import type { PurchaseOrder } from '@/domain/procurement/entities';
import type { PurchaseOrderPageQuery, PageResult } from '@/domain/shared/types';

const DEFAULT_PAGE_SIZE = 20;

export function usePurchaseOrderListQuery(initialQuery?: Partial<PurchaseOrderPageQuery>) {
  const [query, setQuery] = useState<PurchaseOrderPageQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    ...initialQuery,
  });
  const [result, setResult] = useState<PageResult<PurchaseOrder>>({
    items: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async (q: PurchaseOrderPageQuery) => {
    setIsLoading(true);
    setError(null);
    try {
      const repo = getPurchaseOrderRepository();
      const data = await repo.findPage(q);
      if (mountedRef.current) {
        setResult(data);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch purchase orders');
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void fetchData(query);
    return () => { mountedRef.current = false; };
  }, [query, fetchData]);

  const setPage = useCallback((page: number) => setQuery(q => ({ ...q, page })), []);
  const setSearch = useCallback((search: string) => setQuery(q => ({ ...q, search, page: 1 })), []);
  const setStatus = useCallback((status: string | undefined) => setQuery(q => ({ ...q, status, page: 1 })), []);
  const refresh = useCallback(() => void fetchData(query), [fetchData, query]);

  return { ...result, isLoading, error, query, setPage, setSearch, setStatus, refresh };
}
