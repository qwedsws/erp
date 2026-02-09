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

  const hydrate = useCallback(async () => {
    if (isHydrated || isHydrating) return;

    setIsHydrating(true);
    try {
      const supplierRepo = getSupplierRepository();
      const materialRepo = getMaterialRepository();
      const stockRepo = getStockRepository();
      const movementRepo = getStockMovementRepository();
      const purchaseOrderRepo = getPurchaseOrderRepository();
      const purchaseRequestRepo = getPurchaseRequestRepository();
      const materialPriceRepo = getMaterialPriceRepository();
      const steelTagRepo = getSteelTagRepository();

      const [
        suppliers,
        materials,
        stocks,
        stockMovements,
        purchaseOrders,
        purchaseRequests,
        materialPrices,
        steelTags,
      ] = await Promise.all([
        supplierRepo.findAll(),
        materialRepo.findAll(),
        stockRepo.findAll(),
        movementRepo.findAll(),
        purchaseOrderRepo.findAll(),
        purchaseRequestRepo.findAll(),
        materialPriceRepo.findAll(),
        steelTagRepo.findAll(),
      ]);

      setSuppliers(suppliers);
      setMaterials(materials);
      setStocks(stocks);
      setStockMovements(stockMovements);
      setPurchaseOrders(purchaseOrders);
      setPurchaseRequests(purchaseRequests);
      setMaterialPrices(materialPrices);
      setSteelTags(steelTags);
    } catch (error) {
      console.error('Initial hydration failed. Falling back to local cache values.', error);
    } finally {
      setHydrated(true);
      setIsHydrating(false);
    }
  }, [
    isHydrated,
    isHydrating,
    setHydrated,
    setSuppliers,
    setMaterials,
    setStocks,
    setStockMovements,
    setPurchaseOrders,
    setPurchaseRequests,
    setMaterialPrices,
    setSteelTags,
  ]);

  return { isHydrated, isHydrating, hydrate };
}
