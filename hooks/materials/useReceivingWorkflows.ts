'use client';

import { useMemo } from 'react';
import { useMaterials } from '@/hooks/materials/useMaterials';
import { usePurchaseOrders } from '@/hooks/procurement/usePurchaseOrders';
import { useSteelTags } from '@/hooks/procurement/useSteelTags';
import { useStocks } from '@/hooks/materials/useStocks';

export interface SteelTagEntryInput {
  tag_no: string;
  weight: string;
  location: string;
  dimension_w?: number;
  dimension_l?: number;
  dimension_h?: number;
  po_item_id?: string;
}

export interface POReceiveItemInput {
  item_id: string;
  material_id: string;
  quantity: number;
}

export function useReceivingWorkflows() {
  const { materials } = useMaterials();
  const { receivePurchaseOrder } = usePurchaseOrders();
  const { addSteelTag } = useSteelTags();
  const { addStockMovement } = useStocks();

  const materialById = useMemo(
    () => new Map(materials.map((material) => [material.id, material])),
    [materials],
  );

  const receiveFromPurchaseOrder = async (input: {
    poId: string;
    receivedAt: string;
    items: POReceiveItemInput[];
    steelTagEntriesByItem: Record<string, SteelTagEntryInput[]>;
  }) => {
    const itemsToReceive = input.items.filter((item) => item.quantity > 0);
    if (!input.poId) throw new Error('발주서를 선택하세요');
    if (itemsToReceive.length === 0) throw new Error('입고 수량을 입력하세요');

    const receiveResult = await receivePurchaseOrder(
      input.poId,
      itemsToReceive.map((item) => ({ item_id: item.item_id, quantity: item.quantity })),
    );
    if (!receiveResult.ok) throw new Error(receiveResult.error);

    const tagPromises: Promise<unknown>[] = [];
    for (const item of itemsToReceive) {
      const material = materialById.get(item.material_id);
      if (material?.category !== 'STEEL') continue;

      const entries = input.steelTagEntriesByItem[item.item_id] || [];
      for (const entry of entries) {
        if (!entry.weight) continue;

        tagPromises.push(addSteelTag({
          material_id: item.material_id,
          tag_no: entry.tag_no,
          weight: Number(entry.weight),
          status: 'AVAILABLE',
          purchase_order_id: input.poId,
          location: entry.location || undefined,
          received_at: input.receivedAt,
          po_item_id: entry.po_item_id,
          dimension_w: entry.dimension_w,
          dimension_l: entry.dimension_l,
          dimension_h: entry.dimension_h,
        }));
      }
    }
    await Promise.all(tagPromises);
  };

  const receiveDirectStockWithSteelTags = async (input: {
    material_id: string;
    quantity: number;
    unit_price?: number;
    project_id?: string;
    reason?: string;
    receivedAt: string;
    steelTags: SteelTagEntryInput[];
  }) => {
    if (!input.material_id) throw new Error('자재를 선택하세요');
    if (!input.quantity || input.quantity <= 0) throw new Error('수량을 입력하세요');

    const material = materialById.get(input.material_id);
    if (!material) throw new Error('선택한 자재를 찾을 수 없습니다.');

    const isSteel = material.category === 'STEEL';

    if (isSteel && input.steelTags.length > 0 && material.weight_method !== 'CALCULATED') {
      const missingWeight = input.steelTags.some((t) => !t.weight || Number(t.weight) <= 0);
      if (missingWeight) {
        throw new Error('모든 STEEL 태그의 중량을 입력하세요');
      }
    }

    await addStockMovement({
      type: 'IN',
      material_id: input.material_id,
      quantity: input.quantity,
      unit_price: input.unit_price,
      project_id: input.project_id,
      reason: input.reason,
    });

    if (!isSteel) return;

    await Promise.all(
      input.steelTags
        .filter((entry) => entry.weight)
        .map((entry) =>
          addSteelTag({
            material_id: input.material_id,
            tag_no: entry.tag_no,
            weight: Number(entry.weight),
            status: 'AVAILABLE',
            location: entry.location || undefined,
            received_at: input.receivedAt,
            po_item_id: entry.po_item_id,
            dimension_w: entry.dimension_w,
            dimension_l: entry.dimension_l,
            dimension_h: entry.dimension_h,
          }),
        ),
    );
  };

  return {
    receiveFromPurchaseOrder,
    receiveDirectStockWithSteelTags,
  };
}
