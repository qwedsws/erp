'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMaterials } from '@/hooks/materials/useMaterials';
import { useStocks } from '@/hooks/materials/useStocks';
import { useProfiles } from '@/hooks/admin/useProfiles';
import { useProjects } from '@/hooks/projects/useProjects';
import { usePurchaseRequests } from '@/hooks/procurement/usePurchaseRequests';
import { useFeedbackToast } from '@/hooks/shared/useFeedbackToast';
import { calcSteelWeight, calcSteelPrice } from '@/lib/utils';

export interface PRLineItem {
  material_id: string;
  custom_name: string;
  quantity: string;
  reason: string;
  dimension_w: string;
  dimension_l: string;
  dimension_h: string;
}

export interface PRSteelCalc {
  isSteel: boolean;
  hasSteelCalcData: boolean;
  density: number;
  pricePerKg: number;
  pieceWeight: number;
  totalWeight: number;
  estimatedAmount: number;
}

function emptyCalc(): PRSteelCalc {
  return { isSteel: false, hasSteelCalcData: false, density: 0, pricePerKg: 0, pieceWeight: 0, totalWeight: 0, estimatedAmount: 0 };
}

function emptyItem(): PRLineItem {
  return { material_id: '', custom_name: '', quantity: '', reason: '', dimension_w: '', dimension_l: '', dimension_h: '' };
}

export function usePurchaseRequestForm() {
  const router = useRouter();
  const { materials } = useMaterials();
  const { stocks } = useStocks();
  const { profiles } = useProfiles();
  const { projects } = useProjects();
  const { addPurchaseRequests, isLoading } = usePurchaseRequests();
  const { showError, showSuccess } = useFeedbackToast();

  const [header, setHeader] = useState({
    requested_by: '',
    required_date: '',
    project_id: '',
    notes: '',
  });

  const [items, setItems] = useState<PRLineItem[]>([emptyItem()]);

  const materialById = useMemo(
    () => new Map(materials.map((m) => [m.id, m])),
    [materials],
  );

  const stockByMaterialId = useMemo(
    () => new Map(stocks.map((s) => [s.material_id, s])),
    [stocks],
  );

  const calcSteelItem = (item: PRLineItem): PRSteelCalc => {
    const mat = item.material_id ? materialById.get(item.material_id) : null;
    if (!mat || mat.category !== 'STEEL') return emptyCalc();

    const density = Number(mat.density) || 0;
    const pricePerKg = Number(mat.price_per_kg) || 0;
    const hasSteelCalcData = density > 0 && pricePerKg > 0;

    const w = Number(item.dimension_w) || 0;
    const l = Number(item.dimension_l) || 0;
    const h = Number(item.dimension_h) || 0;
    const qty = Number(item.quantity) || 0;

    // 중량은 밀도+치수만으로 계산 (price_per_kg 불필요)
    const pieceWeight = (density > 0 && w > 0 && l > 0 && h > 0)
      ? calcSteelWeight(density, w, l, h)
      : 0;
    const totalWeight = Math.round(pieceWeight * qty * 100) / 100;
    // 예상금액은 pricePerKg가 있을 때만 계산
    const estimatedAmount = (totalWeight > 0 && pricePerKg > 0)
      ? calcSteelPrice(totalWeight, pricePerKg)
      : 0;

    return { isSteel: true, hasSteelCalcData, density, pricePerKg, pieceWeight, totalWeight, estimatedAmount };
  };

  const validItems = useMemo(
    () => items.filter((item) => item.material_id && item.quantity && Number(item.quantity) > 0),
    [items],
  );

  const totalEstimatedAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + calcSteelItem(item).estimatedAmount, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, materialById]);

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PRLineItem, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === 'material_id' && value) {
          const mat = materialById.get(value);
          updated.custom_name = mat?.name || '';
          if (mat?.category === 'STEEL') {
            updated.dimension_w = mat.dimension_w ? String(mat.dimension_w) : '';
            updated.dimension_l = mat.dimension_l ? String(mat.dimension_l) : '';
            updated.dimension_h = mat.dimension_h ? String(mat.dimension_h) : '';
          } else {
            updated.dimension_w = '';
            updated.dimension_l = '';
            updated.dimension_h = '';
          }
        }
        return updated;
      }),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!header.requested_by || !header.required_date) {
      showError('요청자와 필요일은 필수입니다.');
      return;
    }

    if (validItems.length === 0) {
      showError('최소 1개 이상의 자재 항목을 입력하세요.');
      return;
    }

    const missingReason = validItems.some((item) => !item.reason.trim());
    if (missingReason) {
      showError('모든 항목의 사유를 입력하세요.');
      return;
    }

    const payload = validItems.map((item) => {
      const calc = calcSteelItem(item);
      const dimW = Number(item.dimension_w) || undefined;
      const dimL = Number(item.dimension_l) || undefined;
      const dimH = Number(item.dimension_h) || undefined;
      const noteParts = [item.custom_name, header.notes].filter(Boolean);

      return {
        material_id: item.material_id,
        quantity: Number(item.quantity),
        required_date: header.required_date,
        reason: item.reason,
        requested_by: header.requested_by,
        status: 'PENDING' as const,
        project_id: header.project_id || undefined,
        notes: noteParts.length > 0 ? noteParts.join(' | ') : undefined,
        ...(calc.isSteel && dimW && dimL && dimH
          ? {
              dimension_w: dimW,
              dimension_l: dimL,
              dimension_h: dimH,
              piece_weight: calc.pieceWeight > 0 ? Math.round(calc.pieceWeight * 1000) / 1000 : undefined,
            }
          : {}),
      };
    });

    const result = await addPurchaseRequests(payload);
    if (result.ok) {
      showSuccess(`${result.value.length}건의 구매 요청이 등록되었습니다.`);
      router.push('/materials/purchase-requests');
    } else {
      showError(result.error);
    }
  };

  return {
    header,
    setHeader,
    items,
    materials,
    profiles,
    projects,
    materialById,
    stockByMaterialId,
    validItemCount: validItems.length,
    totalEstimatedAmount,
    addItem,
    removeItem,
    updateItem,
    calcSteelItem,
    handleSubmit,
    isLoading,
  };
}
