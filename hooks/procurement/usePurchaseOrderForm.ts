'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePurchaseOrders } from '@/hooks/procurement/usePurchaseOrders';
import { useSuppliers } from '@/hooks/procurement/useSuppliers';
import { useMaterials } from '@/hooks/materials/useMaterials';
import { useFeedbackToast } from '@/hooks/shared/useFeedbackToast';
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

function emptyCalc(): SteelCalc {
  return { isSteel: false, density: 0, pricePerKg: 0, pieceWeight: 0, totalWeight: 0, unitPrice: 0, subtotal: 0 };
}

/**
 * Encapsulates all form state and actions for the "new purchase order" page.
 *
 * Manages:
 * - Basic form fields (supplier, dates, notes)
 * - Line-item CRUD (add / remove / update with auto-fill)
 * - STEEL dimension inputs with auto-calculated weight/price
 * - Total amount calculation (including STEEL weight-based pricing)
 * - Form submission via createPurchaseOrder use-case
 */
export function usePurchaseOrderForm() {
  const router = useRouter();
  const { suppliers } = useSuppliers();
  const { materials } = useMaterials();
  const { createPurchaseOrder } = usePurchaseOrders();
  const { showError, showSuccess } = useFeedbackToast();

  const [form, setForm] = useState({
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
  });

  const [items, setItems] = useState<POItemForm[]>([
    { material_id: '', quantity: '', unit_price: '', dimension_w: '', dimension_l: '', dimension_h: '' },
  ]);

  // O(1) lookup Map
  const materialById = useMemo(
    () => new Map(materials.map(m => [m.id, m])),
    [materials],
  );

  /** Compute STEEL calculations for a single item */
  const calcSteelItem = (item: POItemForm): SteelCalc => {
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
  };

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const calc = calcSteelItem(item);
      if (calc.isSteel) {
        return sum + calc.subtotal;
      }
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      return sum + qty * price;
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, materialById]);

  const addItem = () => {
    setItems(prev => [...prev, { material_id: '', quantity: '', unit_price: '', dimension_w: '', dimension_l: '', dimension_h: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof POItemForm, value: string) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      // Auto-fill when material is selected
      if (field === 'material_id' && value) {
        const mat = materialById.get(value);
        if (mat) {
          if (mat.category === 'STEEL' && mat.price_per_kg) {
            updated.unit_price = String(mat.price_per_kg);
            // Auto-fill default dimensions from material if available
            updated.dimension_w = mat.dimension_w ? String(mat.dimension_w) : '';
            updated.dimension_l = mat.dimension_l ? String(mat.dimension_l) : '';
            updated.dimension_h = mat.dimension_h ? String(mat.dimension_h) : '';
          } else {
            if (mat.unit_price) {
              updated.unit_price = String(mat.unit_price);
            }
            // Clear dimension fields for non-STEEL
            updated.dimension_w = '';
            updated.dimension_l = '';
            updated.dimension_h = '';
          }
        }
      }
      return updated;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplier_id) {
      showError('공급처를 선택하세요');
      return;
    }
    const validItems = items.filter(item => item.material_id && item.quantity);
    if (validItems.length === 0) {
      showError('최소 1개 이상의 자재 항목을 입력하세요');
      return;
    }

    const result = await createPurchaseOrder({
      supplier_id: form.supplier_id,
      status: 'DRAFT',
      order_date: form.order_date,
      due_date: form.due_date || undefined,
      total_amount: totalAmount,
      items: validItems.map(item => {
        const calc = calcSteelItem(item);
        if (calc.isSteel) {
          const w = Number(item.dimension_w) || undefined;
          const l = Number(item.dimension_l) || undefined;
          const h = Number(item.dimension_h) || undefined;
          return {
            material_id: item.material_id,
            quantity: Number(item.quantity),
            unit_price: calc.unitPrice,
            received_quantity: 0,
            dimension_w: w,
            dimension_l: l,
            dimension_h: h,
            piece_weight: calc.pieceWeight > 0 ? Math.round(calc.pieceWeight * 1000) / 1000 : undefined,
            total_weight: calc.totalWeight > 0 ? calc.totalWeight : undefined,
          };
        }
        return {
          material_id: item.material_id,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price) || 0,
          received_quantity: 0,
        };
      }),
      notes: form.notes || undefined,
    });
    if (result.ok) {
      showSuccess('발주가 등록되었습니다.');
      router.push('/materials/purchase-orders');
    } else {
      showError(result.error);
    }
  };

  return {
    form,
    setForm,
    items,
    materials,
    suppliers,
    materialById,
    totalAmount,
    addItem,
    removeItem,
    updateItem,
    handleSubmit,
    calcSteelItem,
  };
}
