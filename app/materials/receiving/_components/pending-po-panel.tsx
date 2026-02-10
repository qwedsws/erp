'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { StatusBadge } from '@/components/common/status-badge';
import { PO_STATUS_MAP, type Material, type PurchaseOrder, type Supplier } from '@/types';
import {
  AlertTriangle,
  Ban,
  Package,
  PackagePlus,
  Trash2,
} from 'lucide-react';

interface PendingPOItemRow {
  poId: string;
  poNo: string;
  poStatus: PurchaseOrder['status'];
  supplierId: string;
  dueDate: string | null;
  orderDate: string;
  isOverdue: boolean;
  daysUntilDue: number | null;
  itemId: string;
  materialId: string;
  orderedQty: number;
  receivedQty: number;
  remainingQty: number;
  unitPrice: number;
  remainingAmount: number;
  progressPct: number;
  isFirstItemOfPO: boolean;
  poItemCount: number;
}

interface PendingPOPanelProps {
  filteredPendingPOs: PurchaseOrder[];
  supplierById: Map<string, Supplier>;
  materialById: Map<string, Material>;
  today: string;
  baseTimeMs: number;
  onCancelPO: (poId: string) => void;
  onDeletePO: (poId: string) => void;
}

export function PendingPOPanel({
  filteredPendingPOs,
  supplierById,
  materialById,
  today,
  baseTimeMs,
  onCancelPO,
  onDeletePO,
}: PendingPOPanelProps) {
  const rows = useMemo<PendingPOItemRow[]>(() => {
    const result: PendingPOItemRow[] = [];
    for (const po of filteredPendingPOs) {
      const isOverdue = po.due_date ? po.due_date < today : false;
      const daysUntilDue = po.due_date
        ? Math.ceil((new Date(po.due_date).getTime() - baseTimeMs) / (1000 * 60 * 60 * 24))
        : null;

      const pendingItems = po.items.filter(
        (item) => item.quantity - (item.received_quantity || 0) > 0,
      );
      const itemsToShow = pendingItems.length > 0 ? pendingItems : po.items;

      itemsToShow.forEach((item, idx) => {
        const received = item.received_quantity || 0;
        const remaining = item.quantity - received;
        result.push({
          poId: po.id,
          poNo: po.po_no,
          poStatus: po.status,
          supplierId: po.supplier_id,
          dueDate: po.due_date ?? null,
          orderDate: po.order_date,
          isOverdue,
          daysUntilDue,
          itemId: item.id,
          materialId: item.material_id,
          orderedQty: item.quantity,
          receivedQty: received,
          remainingQty: remaining,
          unitPrice: item.unit_price,
          remainingAmount: remaining * item.unit_price,
          progressPct: item.quantity > 0 ? Math.round((received / item.quantity) * 100) : 0,
          isFirstItemOfPO: idx === 0,
          poItemCount: itemsToShow.length,
        });
      });
    }
    return result;
  }, [filteredPendingPOs, today, baseTimeMs]);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
        <Package size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium">미입고 발주가 없습니다</p>
        <p className="text-sm mt-1">모든 발주가 입고 완료되었습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">PO#</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">거래처</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">납기일</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">자재코드</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">자재명</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">규격</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">발주</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">입고</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">잔량</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">미입고 금액</th>
            <th className="px-4 py-3 font-medium text-muted-foreground w-24">진행률</th>
            <th className="px-3 py-3 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const material = materialById.get(row.materialId);
            const supplier = supplierById.get(row.supplierId);

            return (
              <tr
                key={row.itemId}
                className={`border-b border-border last:border-0 hover:bg-muted/30 ${
                  row.isFirstItemOfPO && row.poItemCount > 1 ? '' : ''
                }`}
              >
                {/* PO# */}
                <td className="px-4 py-2.5 align-top">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/materials/purchase-orders/${row.poId}`}
                        className="font-mono text-xs font-semibold text-primary hover:underline"
                      >
                        {row.poNo}
                      </Link>
                      <StatusBadge status={row.poStatus} statusMap={PO_STATUS_MAP} />
                    </div>
                    {row.isOverdue && (
                      <span className="inline-flex items-center gap-0.5 mt-1 text-[10px] font-medium text-red-600">
                        <AlertTriangle size={10} />
                        납기초과
                      </span>
                    )}
                  </div>
                </td>

                {/* 거래처 */}
                <td className="px-4 py-2.5 align-top">
                  <span className="text-sm">{supplier?.name || '-'}</span>
                </td>

                {/* 납기일 */}
                <td className="px-4 py-2.5 align-top">
                  <div>
                    <span className={`text-sm ${row.isOverdue ? 'text-red-600 font-medium' : ''}`}>
                      {row.dueDate
                        ? new Date(row.dueDate).toLocaleDateString('ko-KR', {
                            month: '2-digit',
                            day: '2-digit',
                          })
                        : '-'}
                    </span>
                    {row.daysUntilDue !== null && (
                      <span
                        className={`block text-[10px] ${
                          row.daysUntilDue < 0
                            ? 'text-red-500'
                            : row.daysUntilDue <= 3
                              ? 'text-orange-500'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {row.daysUntilDue < 0
                          ? `${Math.abs(row.daysUntilDue)}일 초과`
                          : row.daysUntilDue === 0
                            ? '오늘'
                            : `D-${row.daysUntilDue}`}
                      </span>
                    )}
                  </div>
                </td>

                {/* 자재코드 */}
                <td className="px-4 py-2.5">
                  <span className="font-mono text-xs">{material?.material_code || '-'}</span>
                </td>

                {/* 자재명 */}
                <td className="px-4 py-2.5 font-medium">{material?.name || '-'}</td>

                {/* 규격 */}
                <td className="px-4 py-2.5 text-muted-foreground">{material?.specification || '-'}</td>

                {/* 발주수량 */}
                <td className="px-4 py-2.5 text-right">{row.orderedQty.toLocaleString()}</td>

                {/* 입고수량 */}
                <td className="px-4 py-2.5 text-right text-green-600 font-medium">
                  {row.receivedQty.toLocaleString()}
                </td>

                {/* 잔량 */}
                <td className="px-4 py-2.5 text-right">
                  <span className={row.remainingQty > 0 ? 'text-orange-600 font-bold' : 'text-muted-foreground'}>
                    {row.remainingQty.toLocaleString()}
                  </span>
                </td>

                {/* 미입고 금액 */}
                <td className="px-4 py-2.5 text-right">
                  {row.remainingAmount > 0 ? `${row.remainingAmount.toLocaleString()}원` : '-'}
                </td>

                {/* 진행률 */}
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          row.progressPct >= 100
                            ? 'bg-green-500'
                            : row.progressPct > 0
                              ? 'bg-blue-500'
                              : 'bg-gray-200'
                        }`}
                        style={{ width: `${Math.min(row.progressPct, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-7 text-right">{row.progressPct}%</span>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-3 py-2.5">
                  {row.isFirstItemOfPO && (
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/materials/receiving/new?po=${row.poId}`}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground rounded text-[11px] font-medium hover:bg-primary/90"
                        title="입고처리"
                      >
                        <PackagePlus size={11} />
                        입고
                      </Link>
                      {row.poStatus === 'IN_PROGRESS' && (
                        <>
                          <button
                            onClick={() => onCancelPO(row.poId)}
                            className="p-1 text-orange-500 hover:text-orange-700 transition-colors"
                            title="발주 취소"
                          >
                            <Ban size={13} />
                          </button>
                          <button
                            onClick={() => onDeletePO(row.poId)}
                            className="p-1 text-red-400 hover:text-red-600 transition-colors"
                            title="발주 삭제"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
