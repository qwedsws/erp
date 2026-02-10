'use client';

import { useMemo } from 'react';
import { useERPStore } from '@/store';

export interface ProjectMaterialSummary {
  prAmount: number;       // PR 총액 (qty × material.unit_price)
  poAmount: number;       // PO 총액 (total_amount)
  receivedAmount: number; // 입고 총액 (IN movements: qty × unit_price)
  issuedAmount: number;   // 출고 총액 (OUT movements: qty × unit_price)
  unreceived: number;     // 미입고 = poAmount - receivedAmount
  unissued: number;       // 미출고 = receivedAmount - issuedAmount
  prCount: number;        // 구매요청 건수
}

export function useProjectMaterialSummary(projectId: string | undefined): ProjectMaterialSummary {
  const purchaseRequests = useERPStore((s) => s.purchaseRequests);
  const purchaseOrders = useERPStore((s) => s.purchaseOrders);
  const stockMovements = useERPStore((s) => s.stockMovements);
  const materials = useERPStore((s) => s.materials);

  return useMemo(() => {
    if (!projectId) {
      return { prAmount: 0, poAmount: 0, receivedAmount: 0, issuedAmount: 0, unreceived: 0, unissued: 0, prCount: 0 };
    }

    // Build material unit_price lookup
    const materialPriceMap = new Map<string, number>();
    for (const m of materials) {
      if (m.unit_price != null) {
        materialPriceMap.set(m.id, m.unit_price);
      }
    }

    // PR amount: sum(quantity × material.unit_price)
    const projectPRs = purchaseRequests.filter((pr) => pr.project_id === projectId);
    const prAmount = projectPRs.reduce((sum, pr) => {
      const unitPrice = materialPriceMap.get(pr.material_id) || 0;
      return sum + pr.quantity * unitPrice;
    }, 0);

    // PO amount: sum(total_amount)
    const projectPOs = purchaseOrders.filter((po) => po.project_id === projectId);
    const poAmount = projectPOs.reduce((sum, po) => sum + (po.total_amount || 0), 0);

    // Stock movements for project
    const projectMovements = stockMovements.filter((m) => m.project_id === projectId);
    const receivedAmount = projectMovements
      .filter((m) => m.type === 'IN')
      .reduce((sum, m) => sum + m.quantity * (m.unit_price || 0), 0);
    const issuedAmount = projectMovements
      .filter((m) => m.type === 'OUT')
      .reduce((sum, m) => sum + m.quantity * (m.unit_price || 0), 0);

    return {
      prAmount,
      poAmount,
      receivedAmount,
      issuedAmount,
      unreceived: poAmount - receivedAmount,
      unissued: receivedAmount - issuedAmount,
      prCount: projectPRs.length,
    };
  }, [projectId, purchaseRequests, purchaseOrders, stockMovements, materials]);
}
