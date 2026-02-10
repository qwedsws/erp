'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePurchaseOrders } from '@/hooks/procurement/usePurchaseOrders';
import { useSuppliers } from '@/hooks/procurement/useSuppliers';
import { useMaterials } from '@/hooks/materials/useMaterials';
import { useProfiles } from '@/hooks/admin/useProfiles';
import { useFeedbackToast } from '@/hooks/shared/useFeedbackToast';
import { calcSteelWeight, calcSteelPrice } from '@/lib/utils';
import { getPurchaseRequestRepository } from '@/infrastructure/di/container';
import type { PurchaseRequest } from '@/domain/procurement/entities';

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
 * - Basic form fields (supplier, dates, notes, project_id)
 * - Line-item CRUD (add / remove / update with auto-fill)
 * - STEEL dimension inputs with auto-calculated weight/price
 * - Total amount calculation (including STEEL weight-based pricing)
 * - Form submission via createPurchaseOrder use-case
 * - Import approved Purchase Requests into PO items
 */
export function usePurchaseOrderForm() {
  const router = useRouter();
  const { suppliers } = useSuppliers();
  const { materials } = useMaterials();
  const { profiles } = useProfiles();
  const { createPurchaseOrder } = usePurchaseOrders();
  const { showError, showSuccess, showInfo } = useFeedbackToast();

  const [form, setForm] = useState({
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
    project_id: '',
  });

  const [items, setItems] = useState<POItemForm[]>([
    { material_id: '', quantity: '', unit_price: '', dimension_w: '', dimension_l: '', dimension_h: '' },
  ]);

  // --- PR Import state ---
  const [approvedPRs, setApprovedPRs] = useState<PurchaseRequest[]>([]);
  const [prsLoading, setPrsLoading] = useState(false);
  const [selectedPrIds, setSelectedPrIds] = useState<Set<string>>(new Set());
  const [importedPrIds, setImportedPrIds] = useState<string[]>([]);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Fetch approved PRs from repository on mount
  const prRepo = useMemo(() => getPurchaseRequestRepository(), []);

  useEffect(() => {
    let cancelled = false;
    setPrsLoading(true);
    void prRepo.findAll().then((all) => {
      if (!cancelled) {
        const approved = all.filter((pr) => pr.status === 'APPROVED');
        setApprovedPRs(approved);
        setPrsLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setPrsLoading(false);
    });
    return () => { cancelled = true; };
  }, [prRepo]);

  // Filter out already-imported PRs
  const availablePRs = useMemo(() => {
    const importedSet = new Set(importedPrIds);
    return approvedPRs.filter((pr) => !importedSet.has(pr.id));
  }, [approvedPRs, importedPrIds]);

  // O(1) lookup Maps
  const materialById = useMemo(
    () => new Map(materials.map(m => [m.id, m])),
    [materials],
  );

  const profileById = useMemo(
    () => new Map(profiles.map(p => [p.id, p])),
    [profiles],
  );

  // --- PR selection helpers ---
  const togglePrSelection = useCallback((prId: string) => {
    setSelectedPrIds((prev) => {
      const next = new Set(prev);
      if (next.has(prId)) {
        next.delete(prId);
      } else {
        next.add(prId);
      }
      return next;
    });
  }, []);

  const toggleAllPrs = useCallback((prIds: string[]) => {
    setSelectedPrIds((prev) => {
      const allSelected = prIds.every((id) => prev.has(id));
      if (allSelected) {
        return new Set();
      }
      return new Set(prIds);
    });
  }, []);

  // --- Import PRs into PO items ---
  const importPRs = useCallback(() => {
    if (selectedPrIds.size === 0) {
      showError('불러올 구매요청을 선택하세요');
      return;
    }

    const selectedPRs = approvedPRs.filter((pr) => selectedPrIds.has(pr.id));
    if (selectedPRs.length === 0) return;

    // Create POItemForm entries from selected PRs
    const newItems: POItemForm[] = selectedPRs.map((pr) => {
      const mat = materialById.get(pr.material_id);
      let unitPrice = '';
      if (mat) {
        if (mat.category === 'STEEL' && mat.price_per_kg) {
          unitPrice = String(mat.price_per_kg);
        } else if (mat.unit_price) {
          unitPrice = String(mat.unit_price);
        }
      }
      return {
        material_id: pr.material_id,
        quantity: String(pr.quantity),
        unit_price: unitPrice,
        dimension_w: pr.dimension_w ? String(pr.dimension_w) : (mat?.dimension_w ? String(mat.dimension_w) : ''),
        dimension_l: pr.dimension_l ? String(pr.dimension_l) : (mat?.dimension_l ? String(mat.dimension_l) : ''),
        dimension_h: pr.dimension_h ? String(pr.dimension_h) : (mat?.dimension_h ? String(mat.dimension_h) : ''),
      };
    });

    // Clear empty placeholder items (items where material_id is empty)
    setItems((prev) => {
      const nonEmpty = prev.filter((item) => item.material_id);
      return nonEmpty.length > 0 ? [...nonEmpty, ...newItems] : newItems;
    });

    // If all selected PRs share the same project_id, auto-fill it
    const projectIds = selectedPRs
      .map((pr) => pr.project_id)
      .filter((pid): pid is string => Boolean(pid));
    const uniqueProjectIds = [...new Set(projectIds)];
    if (uniqueProjectIds.length === 1 && !form.project_id) {
      setForm((prev) => ({ ...prev, project_id: uniqueProjectIds[0] }));
    }

    // Track imported PR IDs
    const newImportedIds = selectedPRs.map((pr) => pr.id);
    setImportedPrIds((prev) => [...prev, ...newImportedIds]);

    // Show notice
    setImportNotice(`${selectedPRs.length}건의 구매요청에서 품목을 불러왔습니다`);

    // Clear selection
    setSelectedPrIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPrIds, approvedPRs, materialById, form.project_id]);

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
      const poId = result.value.id;

      // Update imported PRs to COMPLETED status with po_id reference
      if (importedPrIds.length > 0) {
        try {
          await Promise.all(
            importedPrIds.map((prId) =>
              prRepo.update(prId, { status: 'COMPLETED', po_id: poId }),
            ),
          );
        } catch (err) {
          console.error('Failed to update PR status after PO creation:', err);
          showInfo('발주는 등록되었으나 구매요청 상태 업데이트에 실패했습니다.');
        }
      }

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
    profiles,
    materialById,
    profileById,
    totalAmount,
    addItem,
    removeItem,
    updateItem,
    handleSubmit,
    calcSteelItem,
    // PR import
    availablePRs,
    prsLoading,
    selectedPrIds,
    importedPrIds,
    importNotice,
    setImportNotice,
    togglePrSelection,
    toggleAllPrs,
    importPRs,
  };
}
