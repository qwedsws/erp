'use client';

import { StatusBadge } from '@/components/common/status-badge';
import { PO_STATUS_MAP, type PurchaseOrder } from '@/types';

interface SupplierPOHistoryCardProps {
  supplierPOs: PurchaseOrder[];
  onOpenPurchaseOrder: (purchaseOrderId: string) => void;
}

export function SupplierPOHistoryCard({
  supplierPOs,
  onOpenPurchaseOrder,
}: SupplierPOHistoryCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="font-semibold mb-4">발주 이력</h3>
      {supplierPOs.length === 0 ? (
        <p className="text-sm text-muted-foreground">발주 이력이 없습니다.</p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">발주번호</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">발주일</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">납기일</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">금액</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">상태</th>
              </tr>
            </thead>
            <tbody>
              {supplierPOs.map((purchaseOrder) => (
                <tr
                  key={purchaseOrder.id}
                  className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/30"
                  onClick={() => onOpenPurchaseOrder(purchaseOrder.id)}
                >
                  <td className="px-4 py-3 font-mono text-xs">{purchaseOrder.po_no}</td>
                  <td className="px-4 py-3 text-xs">{new Date(purchaseOrder.order_date).toLocaleDateString('ko-KR')}</td>
                  <td className="px-4 py-3 text-xs">
                    {purchaseOrder.due_date ? new Date(purchaseOrder.due_date).toLocaleDateString('ko-KR') : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {purchaseOrder.total_amount ? `${purchaseOrder.total_amount.toLocaleString()}원` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={purchaseOrder.status} statusMap={PO_STATUS_MAP} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
