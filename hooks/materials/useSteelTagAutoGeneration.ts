'use client';

import { useState, useEffect } from 'react';
import { generateSteelTagNo, calcSteelWeight } from '@/lib/utils';
import type { Material, PurchaseOrder } from '@/domain/shared/entities';
import type { ReceiveItemForm } from '@/app/materials/receiving/new/page';

/** Mirrors the SteelTagEntry interface from the steel-tag-table component. */
export interface SteelTagEntry {
  tag_no: string;
  weight: string;
  location: string;
  dimension_w?: number;
  dimension_l?: number;
  dimension_h?: number;
  po_item_id?: string;
}

interface UseSteelTagAutoGenerationParams {
  receiveItems: ReceiveItemForm[];
  materialById: Map<string, Material>;
  steelTagCountByMaterialId: Map<string, number>;
  directMaterialId: string;
  directQuantity: string;
  /** PO lookup map — used to inherit PO item dimensions */
  purchaseOrderById?: Map<string, PurchaseOrder>;
  selectedPOId?: string;
}

/**
 * Manages STEEL tag auto-generation for both PO-based receiving
 * and direct receiving flows.
 *
 * - PO-based: generates tag entries keyed by PO item ID, preserving
 *   existing user input when quantities change.
 * - Direct: generates a flat array of tag entries for the selected
 *   material and quantity.
 */
export function useSteelTagAutoGeneration({
  receiveItems,
  materialById,
  steelTagCountByMaterialId,
  directMaterialId,
  directQuantity,
  purchaseOrderById,
  selectedPOId,
}: UseSteelTagAutoGenerationParams) {
  // === PO-based steel tag entries ===
  const [steelTagEntries, setSteelTagEntries] = useState<Record<string, SteelTagEntry[]>>({});

  // === Direct receiving steel tag entries ===
  const [directSteelTags, setDirectSteelTags] = useState<SteelTagEntry[]>([]);

  // [Issue 1+3 fix] STEEL tag entries — preserve existing inputs, handle all STEEL items
  useEffect(() => {
    const steelItems = receiveItems.filter(item => {
      const mat = materialById.get(item.material_id);
      return mat?.category === 'STEEL';
    });

    if (steelItems.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSteelTagEntries({});
      return;
    }

    // Look up PO to find item-level dimensions
    const po = selectedPOId && purchaseOrderById ? purchaseOrderById.get(selectedPOId) : undefined;
    const poItemById = new Map(
      (po?.items || []).map(poItem => [poItem.id, poItem]),
    );

    setSteelTagEntries(prev => {
      const next: Record<string, SteelTagEntry[]> = {};
      for (const item of steelItems) {
        const mat = materialById.get(item.material_id);
        if (!mat) continue;
        const existing = prev[item.id] || [];
        const needed = item.receiveQty;

        if (needed <= 0) continue;

        // Inherit dimensions from the PO item (if available)
        const poItem = poItemById.get(item.id);
        const dimW = poItem?.dimension_w;
        const dimL = poItem?.dimension_l;
        const dimH = poItem?.dimension_h;
        const hasDims = dimW != null && dimL != null && dimH != null;

        // Calculate weight from PO item dims + material density when CALCULATED
        let autoWeight = '';
        if (mat.weight_method === 'CALCULATED' && hasDims && mat.density) {
          autoWeight = String(
            Math.round(calcSteelWeight(mat.density, dimW, dimL, dimH) * 100) / 100,
          );
        } else if (mat.weight_method === 'CALCULATED') {
          autoWeight = String(mat.weight || 0);
        }

        if (existing.length === needed) {
          // No quantity change — preserve existing inputs as-is
          next[item.id] = existing;
        } else if (existing.length < needed) {
          // Quantity increased — preserve existing + append new entries
          const existingTagCount = steelTagCountByMaterialId.get(mat.id) ?? 0;
          const entries = [...existing];
          for (let i = existing.length; i < needed; i++) {
            entries.push({
              tag_no: generateSteelTagNo(mat.steel_grade || mat.name, existingTagCount + i + 1),
              weight: autoWeight,
              location: '',
              dimension_w: dimW,
              dimension_l: dimL,
              dimension_h: dimH,
              po_item_id: poItem?.id,
            });
          }
          next[item.id] = entries;
        } else {
          // Quantity decreased — trim from the end
          next[item.id] = existing.slice(0, needed);
        }
      }
      return next;
    });
  }, [receiveItems, materialById, steelTagCountByMaterialId, purchaseOrderById, selectedPOId]);

  // [Issue 2 fix] Direct receiving STEEL tag auto-generation — preserve existing inputs
  useEffect(() => {
    const mat = directMaterialId ? materialById.get(directMaterialId) : null;
    if (!mat || mat.category !== 'STEEL' || !directQuantity || Number(directQuantity) <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDirectSteelTags([]);
      return;
    }
    const qty = Number(directQuantity);
    setDirectSteelTags(prev => {
      if (prev.length === qty) return prev;
      const existingTagCount = steelTagCountByMaterialId.get(mat.id) ?? 0;
      if (prev.length < qty) {
        const entries = [...prev];
        for (let i = prev.length; i < qty; i++) {
          entries.push({
            tag_no: generateSteelTagNo(mat.steel_grade || mat.name, existingTagCount + i + 1),
            weight: mat.weight_method === 'CALCULATED' ? String(mat.weight || 0) : '',
            location: '',
          });
        }
        return entries;
      }
      return prev.slice(0, qty);
    });
  }, [directMaterialId, directQuantity, materialById, steelTagCountByMaterialId]);

  return {
    steelTagEntries,
    setSteelTagEntries,
    directSteelTags,
    setDirectSteelTags,
  };
}
