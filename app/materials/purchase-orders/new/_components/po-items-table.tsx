'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Material } from '@/types';
import type { POItemForm, SteelCalc } from '@/hooks/procurement/usePurchaseOrderForm';

interface POItemsTableProps {
  items: POItemForm[];
  materials: Material[];
  materialById: Map<string, Material>;
  calcSteelItem: (item: POItemForm) => SteelCalc;
  updateItem: (index: number, field: keyof POItemForm, value: string) => void;
  removeItem: (index: number) => void;
  addItem: () => void;
  totalAmount: number;
}

export function POItemsTable({
  items,
  materials,
  materialById,
  calcSteelItem,
  updateItem,
  removeItem,
  addItem,
  totalAmount,
}: POItemsTableProps) {
  return (
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

      <div className="rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[960px]">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-3 py-3 text-left font-medium text-muted-foreground w-10">#</th>
              <th className="px-3 py-3 text-left font-medium text-muted-foreground min-w-[200px]">자재</th>
              <th className="px-3 py-3 text-center font-medium text-muted-foreground w-[200px]">치수 W×L×H (mm)</th>
              <th className="px-3 py-3 text-right font-medium text-muted-foreground w-20">수량</th>
              <th className="px-3 py-3 text-right font-medium text-muted-foreground w-28">단가 (원)</th>
              <th className="px-3 py-3 text-right font-medium text-muted-foreground w-28">중량 (kg)</th>
              <th className="px-3 py-3 text-right font-medium text-muted-foreground w-32">소계</th>
              <th className="px-3 py-3 text-center font-medium text-muted-foreground w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const qty = Number(item.quantity) || 0;
              const price = Number(item.unit_price) || 0;
              const selectedMaterial = item.material_id ? materialById.get(item.material_id) : null;
              const calc = calcSteelItem(item);
              const subtotal = calc.isSteel ? calc.subtotal : qty * price;

              return (
                <tr key={index} className="border-b border-border last:border-0 align-middle">
                  <td className="px-3 py-2.5 text-muted-foreground">{index + 1}</td>
                  {/* 자재 */}
                  <td className="px-3 py-2.5">
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
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{selectedMaterial.specification}</p>
                    )}
                    {calc.isSteel && (
                      <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
                        밀도 {calc.density} g/cm³ · {calc.pricePerKg.toLocaleString()} 원/kg
                      </p>
                    )}
                  </td>
                  {/* 치수 W×L×H */}
                  <td className="px-3 py-2.5">
                    {calc.isSteel ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={item.dimension_w}
                          onChange={(e) => updateItem(index, 'dimension_w', e.target.value)}
                          placeholder="W"
                          min="0"
                          className="w-[56px] h-8 px-1.5 rounded border border-input bg-background text-xs text-right focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <span className="text-muted-foreground text-xs">×</span>
                        <input
                          type="number"
                          value={item.dimension_l}
                          onChange={(e) => updateItem(index, 'dimension_l', e.target.value)}
                          placeholder="L"
                          min="0"
                          className="w-[56px] h-8 px-1.5 rounded border border-input bg-background text-xs text-right focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <span className="text-muted-foreground text-xs">×</span>
                        <input
                          type="number"
                          value={item.dimension_h}
                          onChange={(e) => updateItem(index, 'dimension_h', e.target.value)}
                          placeholder="H"
                          min="0"
                          className="w-[56px] h-8 px-1.5 rounded border border-input bg-background text-xs text-right focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-center block">-</span>
                    )}
                  </td>
                  {/* 수량 */}
                  <td className="px-3 py-2.5">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      placeholder="0"
                      min="1"
                      className="w-full h-8 px-2 rounded border border-input bg-background text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </td>
                  {/* 단가 */}
                  <td className="px-3 py-2.5">
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full h-8 px-2 rounded border border-input bg-background text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {calc.isSteel && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 text-right">원/kg</p>
                    )}
                  </td>
                  {/* 중량 */}
                  <td className="px-3 py-2.5 text-right">
                    {calc.isSteel ? (
                      calc.pieceWeight > 0 ? (
                        <div className="text-xs space-y-0.5">
                          <p>{calc.pieceWeight.toFixed(3)} <span className="text-muted-foreground">/ EA</span></p>
                          {qty > 0 && (
                            <p className="font-medium">{calc.totalWeight.toFixed(2)} <span className="text-muted-foreground">총</span></p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">치수 입력</span>
                      )
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  {/* 소계 */}
                  <td className="px-3 py-2.5 text-right font-medium">
                    {subtotal > 0 ? `${subtotal.toLocaleString()}원` : '-'}
                    {calc.isSteel && calc.unitPrice > 0 && (
                      <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                        EA당 {calc.unitPrice.toLocaleString()}원
                      </p>
                    )}
                  </td>
                  {/* 삭제 */}
                  <td className="px-3 py-2.5 text-center">
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
              <td colSpan={6} className="px-3 py-3 text-right font-semibold">합계</td>
              <td className="px-3 py-3 text-right font-bold text-base">
                {totalAmount > 0 ? `${totalAmount.toLocaleString()}원` : '-'}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
