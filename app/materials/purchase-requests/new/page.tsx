'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { useFeedbackToast } from '@/components/common/feedback-toast-provider';
import { useMaterials } from '@/hooks/materials/useMaterials';
import { useStocks } from '@/hooks/materials/useStocks';
import { useProfiles } from '@/hooks/admin/useProfiles';
import { usePurchaseRequests } from '@/hooks/procurement/usePurchaseRequests';
import { calcSteelWeight, calcSteelPrice } from '@/lib/utils';

const inputClass =
  'w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring';

export default function NewPurchaseRequestPage() {
  const router = useRouter();
  const { materials } = useMaterials();
  const { stocks } = useStocks();
  const { profiles } = useProfiles();
  const { addPurchaseRequest } = usePurchaseRequests();
  const { showError, showSuccess } = useFeedbackToast();

  const [form, setForm] = useState({
    material_id: '',
    quantity: '',
    required_date: '',
    reason: '',
    requested_by: '',
    notes: '',
    // STEEL dimension fields
    dimension_w: '',
    dimension_l: '',
    dimension_h: '',
  });

  const materialById = useMemo(
    () => new Map(materials.map((material) => [material.id, material])),
    [materials],
  );
  const stockByMaterialId = useMemo(
    () => new Map(stocks.map((stock) => [stock.material_id, stock])),
    [stocks],
  );

  const selectedMaterial = form.material_id ? materialById.get(form.material_id) : null;
  const isSteel = selectedMaterial?.category === 'STEEL' && !!selectedMaterial.density && !!selectedMaterial.price_per_kg;

  // STEEL calculations
  const steelCalc = useMemo(() => {
    if (!isSteel || !selectedMaterial?.density || !selectedMaterial?.price_per_kg) {
      return { pieceWeight: 0, totalWeight: 0, estimatedAmount: 0 };
    }
    const w = Number(form.dimension_w) || 0;
    const l = Number(form.dimension_l) || 0;
    const h = Number(form.dimension_h) || 0;
    const qty = Number(form.quantity) || 0;

    const pieceWeight = (w > 0 && l > 0 && h > 0)
      ? calcSteelWeight(selectedMaterial.density, w, l, h)
      : 0;
    const totalWeight = Math.round(pieceWeight * qty * 100) / 100;
    const estimatedAmount = totalWeight > 0
      ? calcSteelPrice(totalWeight, selectedMaterial.price_per_kg)
      : 0;

    return { pieceWeight, totalWeight, estimatedAmount };
  }, [isSteel, selectedMaterial, form.dimension_w, form.dimension_l, form.dimension_h, form.quantity]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // When material changes, auto-fill dimensions from material defaults
      if (name === 'material_id' && value) {
        const mat = materialById.get(value);
        if (mat?.category === 'STEEL' && mat.density && mat.price_per_kg) {
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
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.material_id || !form.quantity || !form.required_date || !form.reason.trim() || !form.requested_by) {
      showError('필수 항목을 모두 입력하세요.');
      return;
    }

    const qty = Number(form.quantity);
    if (qty <= 0) {
      showError('수량은 1 이상이어야 합니다.');
      return;
    }

    const dimW = Number(form.dimension_w) || undefined;
    const dimL = Number(form.dimension_l) || undefined;
    const dimH = Number(form.dimension_h) || undefined;

    const result = await addPurchaseRequest({
      material_id: form.material_id,
      quantity: qty,
      required_date: form.required_date,
      reason: form.reason,
      requested_by: form.requested_by,
      status: 'PENDING' as const,
      notes: form.notes || undefined,
      // Include STEEL dimension fields
      ...(isSteel && dimW && dimL && dimH ? {
        dimension_w: dimW,
        dimension_l: dimL,
        dimension_h: dimH,
        piece_weight: steelCalc.pieceWeight > 0 ? Math.round(steelCalc.pieceWeight * 1000) / 1000 : undefined,
      } : {}),
    });
    if (result.ok) {
      showSuccess('구매 요청이 등록되었습니다.');
      router.push('/materials/purchase-requests');
    } else {
      showError(result.error);
    }
  };

  const getStockQuantity = (materialId: string): { quantity: number; unit: string } | null => {
    const material = materialById.get(materialId);
    const stock = stockByMaterialId.get(materialId);
    if (!material) return null;
    return { quantity: stock?.quantity ?? 0, unit: material.unit };
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Link
          href="/materials/purchase-requests"
          className="p-1 rounded hover:bg-accent"
        >
          <ArrowLeft size={18} />
        </Link>
        <span className="text-sm text-muted-foreground">구매 요청</span>
      </div>

      <PageHeader title="구매 요청 등록" description="새로운 구매 요청을 등록합니다" />

      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          {/* 자재 선택 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              자재 선택 <span className="text-destructive">*</span>
            </label>
            <select
              name="material_id"
              value={form.material_id}
              onChange={handleChange}
              required
              className={inputClass}
            >
              <option value="">선택하세요</option>
              {materials.map((m) => {
                const stockInfo = getStockQuantity(m.id);
                return (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {stockInfo
                      ? ` (현재 재고: ${stockInfo.quantity} ${stockInfo.unit})`
                      : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* STEEL Material Info */}
          {isSteel && selectedMaterial && (
            <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs space-y-1">
              <p className="text-blue-700 dark:text-blue-300 font-medium">
                강재 정보: {selectedMaterial.steel_grade || selectedMaterial.name}
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                밀도: {selectedMaterial.density} g/cm3 | kg당 단가: {selectedMaterial.price_per_kg?.toLocaleString()} 원/kg
              </p>
            </div>
          )}

          {/* STEEL Dimension Inputs */}
          {isSteel && (
            <div className="space-y-3">
              <label className="block text-sm font-medium">치수 (mm)</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">가로(W)</label>
                  <input
                    name="dimension_w"
                    type="number"
                    value={form.dimension_w}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">세로(L)</label>
                  <input
                    name="dimension_l"
                    type="number"
                    value={form.dimension_l}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">높이(H)</label>
                  <input
                    name="dimension_h"
                    type="number"
                    value={form.dimension_h}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* STEEL Calculated Values */}
              {steelCalc.pieceWeight > 0 && (
                <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                  <p className="text-emerald-700 dark:text-emerald-300">
                    건당 이론 중량: {steelCalc.pieceWeight.toFixed(3)} kg
                  </p>
                  {steelCalc.totalWeight > 0 && (
                    <p className="text-emerald-700 dark:text-emerald-300">
                      총 중량: {steelCalc.totalWeight.toFixed(2)} kg
                    </p>
                  )}
                  {steelCalc.estimatedAmount > 0 && (
                    <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                      예상 금액: {steelCalc.estimatedAmount.toLocaleString()}원
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 수량 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              수량 <span className="text-destructive">*</span>
            </label>
            <input
              name="quantity"
              type="number"
              min={1}
              value={form.quantity}
              onChange={handleChange}
              required
              placeholder="1"
              className={inputClass}
            />
          </div>

          {/* 필요일 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              필요일 <span className="text-destructive">*</span>
            </label>
            <input
              name="required_date"
              type="date"
              value={form.required_date}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          {/* 요청 사유 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              요청 사유 <span className="text-destructive">*</span>
            </label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              required
              rows={3}
              placeholder="구매 요청 사유를 입력하세요"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* 요청자 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              요청자 <span className="text-destructive">*</span>
            </label>
            <select
              name="requested_by"
              value={form.requested_by}
              onChange={handleChange}
              required
              className={inputClass}
            >
              <option value="">선택하세요</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.department ?? p.role})
                </option>
              ))}
            </select>
          </div>

          {/* 비고 */}
          <div>
            <label className="block text-sm font-medium mb-1.5">비고</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              placeholder="추가 참고 사항 (선택)"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            <Plus size={16} />
            요청 등록
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
