'use client';

import React, { useMemo } from 'react';
import type { ItemWithDetails, ItemTotals } from '@/hooks/procurement/usePurchaseOrderDetailViewModel';

export interface POItemsTableProps {
  items: ItemWithDetails[];
  totals: ItemTotals;
}

export function POItemsTable({ items, totals }: POItemsTableProps) {
  // Show dimension columns only if any item has dimension data
  const hasDimensions = useMemo(
    () => items.some(item => item.dimension_w && item.dimension_l && item.dimension_h),
    [items],
  );

  return (
    <div className="rounded-lg border border-border bg-card p-6 mb-6">
      <h3 className="font-semibold mb-4">발주 품목</h3>
      <div className="rounded-md border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">#</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">자재코드</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">자재명</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">규격</th>
              {hasDimensions && (
                <>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">치수(mm)</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">건당중량</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">총중량</th>
                </>
              )}
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">수량</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">단가</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">소계</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">입고수량</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">잔량</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const isFullyReceived = item.received >= item.quantity;
              const hasRemaining = item.remaining > 0 && item.received > 0;
              const hasDims = item.dimension_w && item.dimension_l && item.dimension_h;
              const dimensionStr = hasDims
                ? `${item.dimension_w}×${item.dimension_l}×${item.dimension_h}`
                : '-';
              return (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs">{item.material?.material_code || '-'}</td>
                  <td className="px-4 py-3 font-medium">{item.material?.name || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.material?.specification || '-'}</td>
                  {hasDimensions && (
                    <>
                      <td className="px-4 py-3 font-mono text-xs">{dimensionStr}</td>
                      <td className="px-4 py-3 text-right">
                        {item.piece_weight != null ? `${item.piece_weight.toFixed(3)} kg` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.total_weight != null ? `${item.total_weight.toFixed(2)} kg` : '-'}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3 text-right">{item.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{item.unit_price.toLocaleString()}원</td>
                  <td className="px-4 py-3 text-right font-medium">{item.subtotal.toLocaleString()}원</td>
                  <td className={`px-4 py-3 text-right font-medium ${isFullyReceived ? 'text-green-600' : hasRemaining ? 'text-yellow-600' : ''}`}>
                    {item.received.toLocaleString()}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${isFullyReceived ? 'text-green-600' : hasRemaining ? 'text-yellow-600' : ''}`}>
                    {item.remaining.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-muted/30 border-t border-border font-semibold">
              <td colSpan={hasDimensions ? 7 : 4} className="px-4 py-3 text-right">합계</td>
              <td className="px-4 py-3 text-right">{totals.quantity.toLocaleString()}</td>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3 text-right">{totals.amount.toLocaleString()}원</td>
              <td className="px-4 py-3 text-right">{totals.received.toLocaleString()}</td>
              <td className="px-4 py-3 text-right">{totals.remaining.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
