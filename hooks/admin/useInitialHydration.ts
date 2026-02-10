'use client';

import { useCallback, useState } from 'react';
import { useERPStore } from '@/store';
import {
  getMaterialPriceRepository,
  getSteelTagRepository,
  getStockMovementRepository,
  getStockRepository,
  getSupplierRepository,
} from '@/infrastructure/di/container';
import type { QueryRangeOptions } from '@/domain/shared/types';

export type HydrationResource =
  | 'suppliers'
  | 'stocks'
  | 'stockMovements'
  | 'materialPrices'
  | 'steelTags';

export interface HydrationRequest {
  resource: HydrationResource;
  options?: QueryRangeOptions;
}

const ALL_RESOURCES: HydrationResource[] = [
  'suppliers',
  'stocks',
  'stockMovements',
  'materialPrices',
  'steelTags',
];

const REQUIRED_RESOURCES: Set<HydrationResource> = new Set(['suppliers', 'stocks']);

const DEFAULT_RESOURCE_LIMITS: Record<HydrationResource, number> = {
  suppliers: 300,
  stocks: 500,
  stockMovements: 1000,
  materialPrices: 1000,
  steelTags: 1000,
};

const hydratedResources = new Set<HydrationResource>();
const inFlightHydrations = new Map<HydrationResource, Promise<void>>();

export function useInitialHydration() {
  const isHydrated = useERPStore((s) => s.isHydrated);
  const setHydrated = useERPStore((s) => s.setHydrated);

  const setSuppliers = useERPStore((s) => s.setSuppliers);
  const setStocks = useERPStore((s) => s.setStocks);
  const setStockMovements = useERPStore((s) => s.setStockMovements);
  const setMaterialPrices = useERPStore((s) => s.setMaterialPrices);
  const setSteelTags = useERPStore((s) => s.setSteelTags);

  const [isHydrating, setIsHydrating] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);

  const hydrateSingle = useCallback(
    async (resource: HydrationResource, options?: QueryRangeOptions) => {
      if (hydratedResources.has(resource)) return;

      const existing = inFlightHydrations.get(resource);
      if (existing) {
        await existing;
        return;
      }

      const task = (async () => {
        const hydratedOptions = {
          limit: DEFAULT_RESOURCE_LIMITS[resource],
          ...options,
        };
        switch (resource) {
          case 'suppliers': {
            const supplierRepo = getSupplierRepository();
            const suppliers = await supplierRepo.findAll(hydratedOptions);
            setSuppliers(suppliers);
            break;
          }
          case 'stocks': {
            const stockRepo = getStockRepository();
            const stocks = await stockRepo.findAll(hydratedOptions);
            setStocks(stocks);
            break;
          }
          case 'stockMovements': {
            const movementRepo = getStockMovementRepository();
            const stockMovements = await movementRepo.findAll(hydratedOptions);
            setStockMovements(stockMovements);
            break;
          }
          case 'materialPrices': {
            const materialPriceRepo = getMaterialPriceRepository();
            const materialPrices = await materialPriceRepo.findAll(hydratedOptions);
            setMaterialPrices(materialPrices);
            break;
          }
          case 'steelTags': {
            const steelTagRepo = getSteelTagRepository();
            const steelTags = await steelTagRepo.findAll(hydratedOptions);
            setSteelTags(steelTags);
            break;
          }
        }
        hydratedResources.add(resource);
      })()
        .catch((error) => {
          console.error(`Hydration failed for resource: ${resource}`, error);
          throw error;
        })
        .finally(() => {
          inFlightHydrations.delete(resource);
        });

      inFlightHydrations.set(resource, task);
      await task;
    },
    [
      setSuppliers,
      setStocks,
      setStockMovements,
      setMaterialPrices,
      setSteelTags,
    ],
  );

  const hydrateResources = useCallback(
    async (requests: HydrationRequest[]) => {
      if (requests.length === 0) return;
      setIsHydrating(true);
      try {
        const results = await Promise.allSettled(
          requests.map((request) =>
            hydrateSingle(request.resource, request.options).then(
              () => request.resource,
            ),
          ),
        );

        const failedResources: string[] = [];
        for (const [i, result] of results.entries()) {
          if (result.status === 'rejected') {
            failedResources.push(requests[i].resource);
          }
        }

        const requiredFailed = failedResources.filter((r) =>
          REQUIRED_RESOURCES.has(r as HydrationResource),
        );

        if (requiredFailed.length > 0) {
          setHydrationError(
            `필수 데이터 로드 실패: ${requiredFailed.join(', ')}`,
          );
        } else if (failedResources.length > 0) {
          setHydrationError(
            `일부 데이터 로드 실패: ${failedResources.join(', ')}`,
          );
          if (!isHydrated) setHydrated(true);
        } else {
          setHydrationError(null);
          if (!isHydrated) setHydrated(true);
        }
      } finally {
        setIsHydrating(false);
      }
    },
    [hydrateSingle, isHydrated, setHydrated],
  );

  const hydrate = useCallback(async () => {
    await hydrateResources(ALL_RESOURCES.map((resource) => ({ resource })));
  }, [hydrateResources]);

  const isResourceHydrated = useCallback((resource: HydrationResource) => {
    return hydratedResources.has(resource);
  }, []);

  return {
    isHydrated,
    isHydrating,
    hydrationError,
    hydrate,
    hydrateResources,
    isResourceHydrated,
  };
}
