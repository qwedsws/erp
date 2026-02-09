'use client';

import { useMemo, useState } from 'react';
import { useMaterials } from '@/hooks/materials/useMaterials';
import { useStocks } from '@/hooks/materials/useStocks';
import { usePurchaseOrders } from '@/hooks/procurement/usePurchaseOrders';
import { useSuppliers } from '@/hooks/procurement/useSuppliers';

export type ReceivingTab = 'pending' | 'history';

export function useReceivingPageData() {
  const { stockMovements } = useStocks();
  const { materials } = useMaterials();
  const { purchaseOrders } = usePurchaseOrders();
  const { suppliers } = useSuppliers();
  const [activeTab, setActiveTab] = useState<ReceivingTab>('pending');
  const [search, setSearch] = useState('');
  const [expandedPOs, setExpandedPOs] = useState<Set<string>>(new Set());

  const materialById = useMemo(
    () => new Map(materials.map((material) => [material.id, material])),
    [materials],
  );
  const purchaseOrderById = useMemo(
    () => new Map(purchaseOrders.map((purchaseOrder) => [purchaseOrder.id, purchaseOrder])),
    [purchaseOrders],
  );
  const supplierById = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.id, supplier])),
    [suppliers],
  );

  const baseDate = useMemo(() => new Date(), []);
  const currentMonth = baseDate.getMonth();
  const currentYear = baseDate.getFullYear();
  const today = baseDate.toISOString().split('T')[0];
  const baseTimeMs = baseDate.getTime();

  const incomingMovements = useMemo(() => {
    return stockMovements
      .filter((stockMovement) => stockMovement.type === 'IN')
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [stockMovements]);

  const pendingPOs = useMemo(() => {
    return purchaseOrders
      .filter((purchaseOrder) => purchaseOrder.status === 'ORDERED' || purchaseOrder.status === 'PARTIAL_RECEIVED')
      .sort((a, b) => {
        if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return b.order_date.localeCompare(a.order_date);
      });
  }, [purchaseOrders]);

  const monthlyCount = useMemo(() => {
    return incomingMovements.filter((stockMovement) => {
      const date = new Date(stockMovement.created_at);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
  }, [incomingMovements, currentMonth, currentYear]);

  const monthlyAmount = useMemo(() => {
    return incomingMovements
      .filter((stockMovement) => {
        const date = new Date(stockMovement.created_at);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, stockMovement) => sum + stockMovement.quantity * (stockMovement.unit_price || 0), 0);
  }, [incomingMovements, currentMonth, currentYear]);

  const pendingPOCount = pendingPOs.length;

  const pendingAmount = useMemo(() => {
    return pendingPOs.reduce((sum, purchaseOrder) => {
      return sum + purchaseOrder.items.reduce((itemSum, item) => {
        const remaining = item.quantity - (item.received_quantity || 0);
        return itemSum + remaining * item.unit_price;
      }, 0);
    }, 0);
  }, [pendingPOs]);

  const overduePOCount = useMemo(() => {
    return pendingPOs.filter((purchaseOrder) => purchaseOrder.due_date && purchaseOrder.due_date < today).length;
  }, [pendingPOs, today]);

  const filteredMovements = useMemo(() => {
    if (!search.trim()) return incomingMovements;
    const keyword = search.trim().toLowerCase();
    return incomingMovements.filter((stockMovement) => {
      const material = materialById.get(stockMovement.material_id);
      const purchaseOrder = stockMovement.purchase_order_id
        ? purchaseOrderById.get(stockMovement.purchase_order_id)
        : null;
      return (
        material?.name.toLowerCase().includes(keyword) ||
        material?.material_code.toLowerCase().includes(keyword) ||
        purchaseOrder?.po_no.toLowerCase().includes(keyword)
      );
    });
  }, [incomingMovements, search, materialById, purchaseOrderById]);

  const filteredPendingPOs = useMemo(() => {
    if (!search.trim()) return pendingPOs;
    const keyword = search.trim().toLowerCase();
    return pendingPOs.filter((purchaseOrder) => {
      const supplier = supplierById.get(purchaseOrder.supplier_id);
      const matchesPO = purchaseOrder.po_no.toLowerCase().includes(keyword);
      const matchesSupplier = supplier?.name.toLowerCase().includes(keyword);
      const matchesMaterial = purchaseOrder.items.some((item) => {
        const material = materialById.get(item.material_id);
        return material?.name.toLowerCase().includes(keyword) || material?.material_code.toLowerCase().includes(keyword);
      });
      return matchesPO || matchesSupplier || matchesMaterial;
    });
  }, [pendingPOs, search, supplierById, materialById]);

  const togglePO = (poId: string) => {
    setExpandedPOs((prev) => {
      const next = new Set(prev);
      if (next.has(poId)) {
        next.delete(poId);
      } else {
        next.add(poId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedPOs(new Set(filteredPendingPOs.map((purchaseOrder) => purchaseOrder.id)));
  };

  const collapseAll = () => {
    setExpandedPOs(new Set());
  };

  return {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    expandedPOs,
    materialById,
    purchaseOrderById,
    supplierById,
    baseTimeMs,
    today,
    incomingMovements,
    filteredMovements,
    pendingPOs,
    filteredPendingPOs,
    monthlyCount,
    monthlyAmount,
    pendingPOCount,
    pendingAmount,
    overduePOCount,
    togglePO,
    expandAll,
    collapseAll,
  };
}
