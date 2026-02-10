'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getMaterialRepository } from '@/infrastructure/di/container';
import type { Material } from '@/domain/materials/entities';
import type { MaterialPageQuery, PageResult } from '@/domain/shared/types';

const DEFAULT_PAGE_SIZE = 20;

export function useMaterialListQuery(initialQuery?: Partial<MaterialPageQuery>) {
  const [query, setQuery] = useState<MaterialPageQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    ...initialQuery,
  });
  const [result, setResult] = useState<PageResult<Material>>({
    items: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async (q: MaterialPageQuery) => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const repo = getMaterialRepository();
      const data = await repo.findPage(q);
      if (mountedRef.current && requestId === requestIdRef.current) {
        setResult(data);
      }
    } catch (err) {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch materials');
      }
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void fetchData(query);
    return () => { mountedRef.current = false; };
  }, [query, fetchData]);

  const setPage = useCallback((page: number) => setQuery(q => ({ ...q, page })), []);
  const setSearch = useCallback((search: string) => setQuery(q => ({ ...q, search, page: 1 })), []);
  const setCategory = useCallback((category: string | undefined) => setQuery(q => ({ ...q, category, page: 1 })), []);
  const refresh = useCallback(() => void fetchData(query), [fetchData, query]);

  return { ...result, isLoading, error, query, setPage, setSearch, setCategory, refresh };
}
