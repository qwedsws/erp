'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getMaterialRepository } from '@/infrastructure/di/container';
import type { Material } from '@/domain/materials/entities';
import type { MaterialPageQuery, PageResult, InventoryStats } from '@/domain/shared/types';

const DEFAULT_PAGE_SIZE = 20;

export function useInventoryListQuery() {
  const [query, setQuery] = useState<MaterialPageQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [result, setResult] = useState<PageResult<Material>>({
    items: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE,
  });
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0, lowStockCount: 0, totalValue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async (q: MaterialPageQuery) => {
    setIsLoading(true);
    setError(null);
    try {
      const repo = getMaterialRepository();
      const data = await repo.findPage(q);
      if (mountedRef.current) setResult(data);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const repo = getMaterialRepository();
      const s = await repo.getInventoryStats();
      if (mountedRef.current) setStats(s);
    } catch {
      // stats fetch failure is non-critical
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void fetchData(query);
    return () => { mountedRef.current = false; };
  }, [query, fetchData]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const setPage = useCallback((page: number) => setQuery(q => ({ ...q, page })), []);
  const setSearch = useCallback((search: string) => setQuery(q => ({ ...q, search, page: 1 })), []);
  const setLowStockOnly = useCallback(
    (val: boolean) => setQuery(q => ({ ...q, lowStockOnly: val || undefined, page: 1 })),
    [],
  );
  const refresh = useCallback(() => {
    void fetchData(query);
    void fetchStats();
  }, [fetchData, fetchStats, query]);

  return {
    ...result,
    stats,
    isLoading,
    error,
    query,
    setPage,
    setSearch,
    setLowStockOnly,
    refresh,
  };
}
