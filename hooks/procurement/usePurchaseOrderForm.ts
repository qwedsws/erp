'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePurchaseOrders } from '@/hooks/procurement/usePurchaseOrders';
import { useSuppliers } from '@/hooks/procurement/useSuppliers';
import { useMaterials } from '@/hooks/materials/useMaterials';
import { useFeedbackToast } from '@/components/common/feedback-toast-provider';
import { calcTotalWeight, calcSteelOrderAmount } from '@/lib/utils';

interface POItemForm {
  material_id: string;
  quantity: string;
  unit_price: string;
}

/**
 * Encapsulates all form state and actions for the "new purchase order" page.
 *
 * Manages:
 * - Basic form fields (supplier, dates, notes)
 * - Line-item CRUD (add / remove / update with auto-fill)
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
    { material_id: '', quantity: '', unit_price: '' },
  ]);

  // O(1) lookup Map
  const materialById = useMemo(
    () => new Map(materials.map(m => [m.id, m])),
    [materials],
  );

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      const mat = item.material_id ? materialById.get(item.material_id) : null;
      if (mat?.category === 'STEEL' && mat.weight && mat.price_per_kg) {
        const totalWeight = calcTotalWeight(qty, mat.weight);
        return sum + calcSteelOrderAmount(totalWeight, mat.price_per_kg);
      }
      return sum + qty * price;
    }, 0);
  }, [items, materialById]);

  const addItem = () => {
    setItems(prev => [...prev, { material_id: '', quantity: '', unit_price: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof POItemForm, value: string) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      // Auto-fill unit_price from material when material is selected
      if (field === 'material_id' && value) {
        const mat = materialById.get(value);
        if (mat) {
          if (mat.category === 'STEEL' && mat.price_per_kg) {
            updated.unit_price = String(mat.price_per_kg);
          } else if (mat.unit_price) {
            updated.unit_price = String(mat.unit_price);
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
        const mat = materialById.get(item.material_id);
        const isSteel = mat?.category === 'STEEL' && mat.weight && mat.price_per_kg;
        return {
          material_id: item.material_id,
          quantity: Number(item.quantity),
          unit_price: isSteel
            ? Math.round((mat.weight ?? 0) * (mat.price_per_kg ?? 0))
            : Number(item.unit_price) || 0,
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
  };
}
