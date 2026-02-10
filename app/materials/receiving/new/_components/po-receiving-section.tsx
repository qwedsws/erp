'use client';

import React from 'react';
import { Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Material, PurchaseOrder, Supplier } from '@/types';
import type { ReceiveItemForm } from '@/hooks/materials/receiving-types';
import { SteelTagTable, WeightSummary } from './steel-tag-table';
import type { SteelTagEntry } from './steel-tag-table';

interface POReceivingSectionProps {
  selectedPOId: string;
  setSelectedPOId: (id: string) => void;
  poReceiveDate: string;
  setPOReceiveDate: (date: string) => void;
  receiveItems: ReceiveItemForm[];
  updateReceiveQty: (itemId: string, value: number) => void;
  steelTagEntries: Record<string, SteelTagEntry[]>;
  setSteelTagEntries: React.Dispatch<React.SetStateAction<Record<string, SteelTagEntry[]>>>;
  receivablePOs: PurchaseOrder[];
  materialById: Map<string, Material>;
  supplierById: Map<string, Supplier>;
  purchaseOrderById: Map<string, PurchaseOrder>;
  onSubmit: (e: React.FormEvent) => void;
}

export function POReceivingSection({
  selectedPOId,
  setSelectedPOId,
  poReceiveDate,
  setPOReceiveDate,
  receiveItems,
  updateReceiveQty,
  steelTagEntries,
  setSteelTagEntries,
  receivablePOs,
  materialById,
  supplierById,
  purchaseOrderById,
  onSubmit,
}: POReceivingSectionProps) {
  const router = useRouter();

  return (
    <form onSubmit={onSubmit} className="max-w-5xl">
      <div className="rounded-lg border border-border bg-card p-6 space-y-4 mb-6">
        <h3 className="text-sm font-semibold">발주 정보</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">발주서 선택 *</label>
            <select
              value={selectedPOId}
              onChange={(e) => setSelectedPOId(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">선택하세요</option>
              {receivablePOs.map(po => {
                const sup = supplierById.get(po.supplier_id);
                return (
                  <option key={po.id} value={po.id}>
                    {po.po_no} - {sup?.name || '알 수 없음'}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">입고일</label>
            <input
              type="date"
              value={poReceiveDate}
              onChange={(e) => setPOReceiveDate(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* PO Items Table */}
      {selectedPOId && receiveItems.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-4 mb-6">
          <h3 className="text-sm font-semibold">입고 품목</h3>
          {(() => {
            // Check if any PO items have dimensions to show the dimension column
            const po = purchaseOrderById.get(selectedPOId);
            const poItemById = new Map((po?.items || []).map(pi => [pi.id, pi]));
            const hasDimensionItems = receiveItems.some(item => {
              const poItem = poItemById.get(item.id);
              return poItem?.dimension_w != null || poItem?.dimension_l != null || poItem?.dimension_h != null;
            });

            return (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">자재코드</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">자재명</th>
                      {hasDimensionItems && (
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">치수(mm)</th>
                      )}
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">발주수량</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">기입고량</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">잔량</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground w-36">입고수량</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">단가</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiveItems.map(item => {
                      const mat = materialById.get(item.material_id);
                      const poItem = poItemById.get(item.id);
                      const remaining = item.quantity - item.received_quantity;
                      const dimStr = (poItem?.dimension_w != null || poItem?.dimension_l != null || poItem?.dimension_h != null)
                        ? `${poItem?.dimension_w ?? '-'}×${poItem?.dimension_l ?? '-'}×${poItem?.dimension_h ?? '-'}`
                        : null;
                      return (
                        <tr key={item.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs">{mat?.material_code || '-'}</span>
                          </td>
                          <td className="px-4 py-3 font-medium">{mat?.name || '-'}</td>
                          {hasDimensionItems && (
                            <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">
                              {dimStr || '-'}
                            </td>
                          )}
                          <td className="px-4 py-3 text-right">{item.quantity.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">{item.received_quantity.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-medium">{remaining.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={item.receiveQty}
                              onChange={(e) => updateReceiveQty(item.id, Number(e.target.value))}
                              min={0}
                              max={remaining}
                              className="w-full h-8 px-2 rounded border border-input bg-background text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            {item.unit_price.toLocaleString()}원
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* [Issue 3 fix] STEEL 태그 섹션 — 모든 STEEL 항목 렌더링 */}
          {(() => {
            const steelItems = receiveItems.filter(item => {
              const mat = materialById.get(item.material_id);
              return mat?.category === 'STEEL' && item.receiveQty > 0;
            });
            const hasEntries = steelItems.some(si => (steelTagEntries[si.id] || []).length > 0);
            if (steelItems.length === 0 || !hasEntries) return null;

            return (
              <div className="mt-6 pt-6 border-t border-border space-y-6">
                {steelItems.map(steelItem => {
                  const entries = steelTagEntries[steelItem.id] || [];
                  if (entries.length === 0) return null;
                  const mat = materialById.get(steelItem.material_id);
                  if (!mat) return null;
                  const po = purchaseOrderById.get(selectedPOId);
                  const weightMethod = mat.weight_method || 'MEASURED';
                  const theoreticalWeight = mat.weight || 0;
                  const totalMeasured = entries.reduce((sum, e) => sum + (Number(e.weight) || 0), 0);
                  const theoreticalTotal = steelItem.receiveQty * theoreticalWeight;

                  return (
                    <div key={steelItem.id} className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold">
                          STEEL 입고 처리 ({weightMethod === 'MEASURED' ? '실측' : '계산값'})
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          발주: {po?.po_no} | {mat.name} ({mat.specification}) | {steelItem.receiveQty} EA
                        </p>
                      </div>

                      <SteelTagTable
                        entries={entries}
                        weightMethod={weightMethod}
                        showDimensions={entries.some(e => e.dimension_w != null || e.dimension_l != null || e.dimension_h != null)}
                        editableDimensions={false}
                        onUpdate={(idx, field, val) => {
                          const itemId = steelItem.id;
                          setSteelTagEntries(prev => ({
                            ...prev,
                            [itemId]: (prev[itemId] || []).map((ent, i) =>
                              i === idx ? { ...ent, [field]: val } : ent
                            ),
                          }));
                        }}
                      />

                      {/* 중량 합계 */}
                      <WeightSummary
                        weightMethod={weightMethod}
                        totalMeasured={totalMeasured}
                        theoreticalTotal={theoreticalTotal}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!selectedPOId}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={16} />
          저장
        </button>
        <button
          type="button"
          onClick={() => router.push('/materials/receiving')}
          className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent"
        >
          취소
        </button>
      </div>
    </form>
  );
}
