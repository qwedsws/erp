'use client';

import type {
  MaterialCategory,
  SteelWeightMethod,
  ToolType,
} from '@/domain/shared/entities';
import type { ChangeEvent } from 'react';

export interface MaterialFormState {
  material_code: string;
  name: string;
  category: MaterialCategory;
  specification: string;
  unit: string;
  inventory_unit: string;
  unit_price: string;
  safety_stock: string;
  lead_time: string;
  supplier_id: string;
  notes: string;
  steel_grade: string;
  density: string;
  dimension_w: string;
  dimension_l: string;
  dimension_h: string;
  weight_method: SteelWeightMethod;
  price_per_kg: string;
  tool_type: '' | ToolType;
  tool_diameter: string;
  tool_length: string;
  max_usage_count: string;
  regrind_max: string;
  min_order_qty: string;
}

export type MaterialFormChangeEvent = ChangeEvent<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
>;
