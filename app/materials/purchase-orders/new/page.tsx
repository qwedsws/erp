'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/common/page-header';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { calcTotalWeight, calcSteelOrderAmount } from '@/lib/utils';
import { usePurchaseOrderForm } from '@/hooks/procurement/usePurchaseOrderForm';

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const {
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
  } = usePurchaseOrderForm();

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.push('/materials/purchase-orders')} className="p-1 rounded hover:bg-accent">
          <ArrowLeft size={18} />
        </button>
        <span className="text-sm text-muted-foreground">발주 관리</span>
      </div>
      <PageHeader title="발주 등록" description="새로운 구매 발주를 등록합니다" />

      <form onSubmit={handleSubmit} className="max-w-4xl">
        {/* Basic Info */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4 mb-6">
          <h3 className="text-sm font-semibold">기본 정보</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">공급처 *</label>
              <select
                value={form.supplier_id}
                onChange={(e) => setForm(prev => ({ ...prev, supplier_id: e.target.value }))}
                required
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">선택하세요</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">발주일 *</label>
              <input
                type="date"
                value={form.order_date}
                onChange={(e) => setForm(prev => ({ ...prev, order_date: e.target.value }))}
                required
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">납기일</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm(prev => ({ ...prev, due_date: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">비고</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>

        {/* Items */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">발주 품목</h3>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-muted rounded-md hover:bg-muted/80 transition-colors"
            >
              <Plus size={14} />
              품목 추가
            </button>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">#</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">자재</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground w-32">수량</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground w-40">단가 (원)</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground w-40">소계</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground w-16"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const qty = Number(item.quantity) || 0;
                  const price = Number(item.unit_price) || 0;
                  const selectedMaterial = item.material_id ? materialById.get(item.material_id) : null;
                  const isSteel = selectedMaterial?.category === 'STEEL';
                  const totalWeightKg = isSteel ? calcTotalWeight(qty, selectedMaterial?.weight || 0) : 0;
                  const subtotal = isSteel && selectedMaterial?.weight && selectedMaterial?.price_per_kg
                    ? calcSteelOrderAmount(totalWeightKg, selectedMaterial.price_per_kg)
                    : qty * price;
                  return (
                    <tr key={index} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-muted-foreground align-top">{index + 1}</td>
                      <td className="px-4 py-3">
                        <select
                          value={item.material_id}
                          onChange={(e) => updateItem(index, 'material_id', e.target.value)}
                          className="w-full h-8 px-2 rounded border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="">자재 선택</option>
                          {materials.map(m => (
                            <option key={m.id} value={m.id}>
                              [{m.material_code}] {m.name} ({m.unit})
                            </option>
                          ))}
                        </select>
                        {selectedMaterial?.specification && (
                          <p className="text-xs text-muted-foreground mt-0.5">{selectedMaterial.specification}</p>
                        )}
                        {isSteel && selectedMaterial?.weight && selectedMaterial?.price_per_kg && (
                          <div className="mt-1.5 p-2 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs space-y-0.5">
                            <p className="text-blue-700 dark:text-blue-300">
                              이론 중량: {selectedMaterial.weight.toFixed(2)} kg/EA
                            </p>
                            <p className="text-blue-700 dark:text-blue-300">
                              kg당 단가: {selectedMaterial.price_per_kg.toLocaleString()} 원/kg
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {isSteel && (
                          <p className="text-xs text-muted-foreground mb-1">수량 (EA)</p>
                        )}
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          placeholder="0"
                          min="1"
                          className="w-full h-8 px-2 rounded border border-input bg-background text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {isSteel && qty > 0 && selectedMaterial?.weight && selectedMaterial?.price_per_kg && (
                          <div className="mt-1.5 text-xs space-y-0.5">
                            <p className="text-muted-foreground">
                              총 중량: {totalWeightKg.toFixed(2)} kg
                            </p>
                            <p className="text-muted-foreground">
                              발주 금액: {calcSteelOrderAmount(totalWeightKg, selectedMaterial.price_per_kg).toLocaleString()} 원
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {isSteel && (
                          <p className="text-xs text-muted-foreground mb-1">kg당 단가</p>
                        )}
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                          placeholder="0"
                          min="0"
                          className="w-full h-8 px-2 rounded border border-input bg-background text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium align-top">
                        {subtotal > 0 ? `${subtotal.toLocaleString()}원` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center align-top">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={items.length <= 1}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 border-t border-border">
                  <td colSpan={4} className="px-4 py-3 text-right font-semibold">합계</td>
                  <td className="px-4 py-3 text-right font-bold text-base">
                    {totalAmount > 0 ? `${totalAmount.toLocaleString()}원` : '-'}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">
            저장
          </button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent">
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
