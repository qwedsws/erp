'use client';

import Link from 'next/link';
import type { Material, PurchaseOrder, StockMovement } from '@/types';

interface ReceivingHistoryPanelProps {
  filteredMovements: StockMovement[];
  materialById: Map<string, Material>;
  purchaseOrderById: Map<string, PurchaseOrder>;
}

export function ReceivingHistoryPanel({
  filteredMovements,
  materialById,
  purchaseOrderById,
}: ReceivingHistoryPanelProps) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">입고일</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">자재코드</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">자재명</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">수량</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">단가</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">금액</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">발주번호</th>
          </tr>
        </thead>
        <tbody>
          {filteredMovements.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                입고 이력이 없습니다.
              </td>
            </tr>
          ) : (
            filteredMovements.map((stockMovement) => {
              const material = materialById.get(stockMovement.material_id);
              const purchaseOrder = stockMovement.purchase_order_id
                ? purchaseOrderById.get(stockMovement.purchase_order_id)
                : null;
              const amount = stockMovement.quantity * (stockMovement.unit_price || 0);
              return (
                <tr key={stockMovement.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 text-xs">
                    {new Date(stockMovement.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs">{material?.material_code || '-'}</span>
                  </td>
                  <td className="px-4 py-3 font-medium">{material?.name || '-'}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {stockMovement.quantity.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {stockMovement.unit_price ? `${stockMovement.unit_price.toLocaleString()}원` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {amount > 0 ? `${amount.toLocaleString()}원` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {purchaseOrder ? (
                      <Link
                        href={`/materials/purchase-orders/${purchaseOrder.id}`}
                        className="text-xs font-mono text-primary hover:underline"
                      >
                        {purchaseOrder.po_no}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">직접입고</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
