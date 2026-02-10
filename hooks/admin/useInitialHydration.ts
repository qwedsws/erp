'use client';

import { useCallback, useState } from 'react';
import { useERPStore } from '@/store';
import {
  getMaterialPriceRepository,
  getMaterialRepository,
  getPurchaseOrderRepository,
  getPurchaseRequestRepository,
  getSteelTagRepository,
  getStockMovementRepository,
  getStockRepository,
  getSupplierRepository,
} from '@/infrastructure/di/container';
import type { QueryRangeOptions } from '@/domain/shared/types';

export type HydrationResource =
  | 'suppliers'
  | 'materials'
  | 'stocks'
  | 'stockMovements'
  | 'purchaseOrders'
  | 'purchaseRequests'
  | 'materialPrices'
  | 'steelTags';

export interface HydrationRequest {
  resource: HydrationResource;
  options?: QueryRangeOptions;
}

const ALL_RESOURCES: HydrationResource[] = [
  'suppliers',
  'materials',
  'stocks',
  'stockMovements',
  'purchaseOrders',
  'purchaseRequests',
  'materialPrices',
  'steelTags',
];

const DEFAULT_RESOURCE_LIMITS: Record<HydrationResource, number> = {
  suppliers: 300,
  materials: 500,
  stocks: 500,
  stockMovements: 1000,
  purchaseOrders: 500,
  purchaseRequests: 500,
  materialPrices: 1000,
  steelTags: 1000,
};

const hydratedResources = new Set<HydrationResource>();
const inFlightHydrations = new Map<HydrationResource, Promise<void>>();

export function useInitialHydration() {
  const isHydrated = useERPStore((s) => s.isHydrated);
  const setHydrated = useERPStore((s) => s.setHydrated);

  const setSuppliers = useERPStore((s) => s.setSuppliers);
  const setMaterials = useERPStore((s) => s.setMaterials);
  const setStocks = useERPStore((s) => s.setStocks);
  const setStockMovements = useERPStore((s) => s.setStockMovements);
  const setPurchaseOrders = useERPStore((s) => s.setPurchaseOrders);
  const setPurchaseRequests = useERPStore((s) => s.setPurchaseRequests);
  const setMaterialPrices = useERPStore((s) => s.setMaterialPrices);
  const setSteelTags = useERPStore((s) => s.setSteelTags);

  const [isHydrating, setIsHydrating] = useState(false);

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
          case 'materials': {
            const materialRepo = getMaterialRepository();
            const materials = await materialRepo.findAll(hydratedOptions);
            setMaterials(materials);
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
          case 'purchaseOrders': {
            const purchaseOrderRepo = getPurchaseOrderRepository();
            const purchaseOrders = await purchaseOrderRepo.findAll(hydratedOptions);
            setPurchaseOrders(purchaseOrders);
            break;
          }
          case 'purchaseRequests': {
            const purchaseRequestRepo = getPurchaseRequestRepository();
            const purchaseRequests = await purchaseRequestRepo.findAll(hydratedOptions);
            setPurchaseRequests(purchaseRequests);
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
      setMaterials,
      setStocks,
      setStockMovements,
      setPurchaseOrders,
      setPurchaseRequests,
      setMaterialPrices,
      setSteelTags,
    ],
  );

  const hydrateResources = useCallback(
    async (requests: HydrationRequest[]) => {
      if (requests.length === 0) return;
      setIsHydrating(true);
      try {
        await Promise.all(
          requests.map((request) => hydrateSingle(request.resource, request.options)),
        );
      } finally {
        if (!isHydrated) {
          setHydrated(true);
        }
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
    hydrate,
    hydrateResources,
    isResourceHydrated,
  };
}
