import type { Material } from '@/domain/materials/entities';
import { calcSteelWeight, calcSteelPrice } from '@/lib/utils';

export interface POItemForm {
  material_id: string;
  quantity: string;
  unit_price: string;
  // STEEL dimension fields (mm)
  dimension_w: string;
  dimension_l: string;
  dimension_h: string;
}

/** Derived STEEL calculations for a single PO item */
export interface SteelCalc {
  isSteel: boolean;
  density: number;
  pricePerKg: number;
  pieceWeight: number;   // kg per EA
  totalWeight: number;   // pieceWeight x qty
  unitPrice: number;     // pieceWeight x pricePerKg (per EA)
  subtotal: number;      // totalWeight x pricePerKg
}

export function emptyCalc(): SteelCalc {
  return { isSteel: false, density: 0, pricePerKg: 0, pieceWeight: 0, totalWeight: 0, unitPrice: 0, subtotal: 0 };
}

/** Pure function: compute STEEL calculations for a single PO item given a material lookup map */
export function calcSteelForItem(item: POItemForm, materialById: Map<string, Material>): SteelCalc {
  const mat = item.material_id ? materialById.get(item.material_id) : null;
  if (!mat || mat.category !== 'STEEL' || !mat.density || !mat.price_per_kg) return emptyCalc();

  const w = Number(item.dimension_w) || 0;
  const l = Number(item.dimension_l) || 0;
  const h = Number(item.dimension_h) || 0;
  const qty = Number(item.quantity) || 0;

  const pieceWeight = (w > 0 && l > 0 && h > 0) ? calcSteelWeight(mat.density, w, l, h) : 0;
  const totalWeight = Math.round(pieceWeight * qty * 100) / 100;
  const unitPrice = pieceWeight > 0 ? calcSteelPrice(pieceWeight, mat.price_per_kg) : 0;
  const subtotal = totalWeight > 0 ? calcSteelPrice(totalWeight, mat.price_per_kg) : 0;

  return {
    isSteel: true,
    density: mat.density,
    pricePerKg: mat.price_per_kg,
    pieceWeight,
    totalWeight,
    unitPrice,
    subtotal,
  };
}
