'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFeedbackToast } from '@/components/common/feedback-toast-provider';
import type { MaterialCategory } from '@/domain/shared/entities';
import { STEEL_GRADE_DENSITY } from '@/types/display';
import { calcSteelWeight, calcSteelPrice } from '@/lib/utils';
import { useMaterials } from '@/hooks/materials/useMaterials';
import type {
  MaterialFormChangeEvent,
  MaterialFormState,
} from '@/hooks/materials/material-form-types';

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UseMaterialFormReturn {
  form: MaterialFormState;
  category: MaterialCategory;
  steelCalc: { weight: number; unitPrice: number };
  handleChange: (event: MaterialFormChangeEvent) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Initial state factory
// ---------------------------------------------------------------------------

function createInitialFormState(): MaterialFormState {
  return {
    material_code: '',
    name: '',
    category: 'STEEL',
    specification: '',
    unit: 'KG',
    inventory_unit: 'EA',
    unit_price: '',
    safety_stock: '',
    lead_time: '',
    supplier_id: '',
    notes: '',
    // STEEL fields
    steel_grade: '',
    density: '',
    dimension_w: '',
    dimension_l: '',
    dimension_h: '',
    weight_method: 'CALCULATED',
    price_per_kg: '',
    // TOOL fields
    tool_type: '',
    tool_diameter: '',
    tool_length: '',
    max_usage_count: '',
    regrind_max: '',
    // CONSUMABLE fields
    min_order_qty: '',
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMaterialForm(): UseMaterialFormReturn {
  const router = useRouter();
  const { addMaterial } = useMaterials();
  const { showError, showSuccess } = useFeedbackToast();

  const [form, setForm] = useState<MaterialFormState>(createInitialFormState);

  const category = form.category;

  // ---- Steel auto-calc ----
  const steelCalc = useMemo(() => {
    if (category !== 'STEEL') return { weight: 0, unitPrice: 0 };
    const w = Number(form.dimension_w);
    const l = Number(form.dimension_l);
    const h = Number(form.dimension_h);
    const d = Number(form.density);
    const weight = d && w && l && h ? calcSteelWeight(d, w, l, h) : 0;
    const unitPrice =
      weight && Number(form.price_per_kg)
        ? calcSteelPrice(weight, Number(form.price_per_kg))
        : 0;
    return { weight, unitPrice };
  }, [
    category,
    form.dimension_w,
    form.dimension_l,
    form.dimension_h,
    form.density,
    form.price_per_kg,
  ]);

  // ---- Change handler ----
  const handleChange = useCallback((event: MaterialFormChangeEvent) => {
    const { name, value } = event.target;
    const key = name as keyof MaterialFormState;
    setForm((prev) => {
      const next = { ...prev, [key]: value } as MaterialFormState;

      // Category change: auto-set units and reset category-specific fields
      if (key === 'category') {
        const cat = value as MaterialCategory;
        if (cat === 'STEEL') {
          next.unit = 'KG';
          next.inventory_unit = 'EA';
        } else if (cat === 'TOOL') {
          next.unit = 'EA';
          next.inventory_unit = '';
        } else if (cat === 'CONSUMABLE') {
          next.unit = prev.unit; // keep current or default
          next.inventory_unit = '';
        } else {
          // STANDARD_PART, PURCHASED
          next.unit = 'EA';
          next.inventory_unit = '';
        }
      }

      // Steel grade change: auto-fill density
      if (key === 'steel_grade' && value) {
        const d = STEEL_GRADE_DENSITY[value];
        if (d !== undefined) {
          next.density = String(d);
        }
      }

      return next;
    });
  }, []);

  // ---- Submit handler ----
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.material_code.trim() || !form.name.trim()) {
        showError('자재코드와 자재명을 입력하세요');
        return;
      }

      // Compute final unit_price for STEEL from auto-calc
      const finalUnitPrice =
        category === 'STEEL' && steelCalc.unitPrice
          ? steelCalc.unitPrice
          : form.unit_price
            ? Number(form.unit_price)
            : undefined;

      try {
        await addMaterial({
          material_code: form.material_code,
          name: form.name,
          category,
          specification: form.specification || undefined,
          unit: form.unit,
          inventory_unit: form.inventory_unit || undefined,
          unit_price: finalUnitPrice,
          safety_stock: form.safety_stock ? Number(form.safety_stock) : undefined,
          lead_time: form.lead_time ? Number(form.lead_time) : undefined,
          supplier_id: form.supplier_id || undefined,
          notes: form.notes || undefined,
          // STEEL
          steel_grade: form.steel_grade || undefined,
          density: form.density ? Number(form.density) : undefined,
          dimension_w: form.dimension_w ? Number(form.dimension_w) : undefined,
          dimension_l: form.dimension_l ? Number(form.dimension_l) : undefined,
          dimension_h: form.dimension_h ? Number(form.dimension_h) : undefined,
          weight: steelCalc.weight || undefined,
          price_per_kg: form.price_per_kg ? Number(form.price_per_kg) : undefined,
          weight_method: form.weight_method,
          // TOOL
          tool_type: form.tool_type || undefined,
          tool_diameter: form.tool_diameter
            ? Number(form.tool_diameter)
            : undefined,
          tool_length: form.tool_length ? Number(form.tool_length) : undefined,
          max_usage_count: form.max_usage_count
            ? Number(form.max_usage_count)
            : undefined,
          regrind_max: form.regrind_max ? Number(form.regrind_max) : undefined,
          // CONSUMABLE
          min_order_qty: form.min_order_qty
            ? Number(form.min_order_qty)
            : undefined,
        });
        showSuccess('자재가 등록되었습니다.');
        router.push('/materials/items');
      } catch (err) {
        showError(
          err instanceof Error ? err.message : '자재 등록 중 오류가 발생했습니다.',
        );
      }
    },
    [form, category, steelCalc, addMaterial, showError, showSuccess, router],
  );

  return {
    form,
    category,
    steelCalc,
    handleChange,
    handleSubmit,
  };
}
