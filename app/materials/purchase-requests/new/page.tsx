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
  });

  const materialById = useMemo(
    () => new Map(materials.map((material) => [material.id, material])),
    [materials],
  );
  const stockByMaterialId = useMemo(
    () => new Map(stocks.map((stock) => [stock.material_id, stock])),
    [stocks],
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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

    const result = await addPurchaseRequest({
      material_id: form.material_id,
      quantity: qty,
      required_date: form.required_date,
      reason: form.reason,
      requested_by: form.requested_by,
      status: 'PENDING' as const,
      notes: form.notes || undefined,
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
