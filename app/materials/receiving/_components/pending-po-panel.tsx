'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/common/status-badge';
import { PO_STATUS_MAP, type Material, type PurchaseOrder, type Supplier } from '@/types';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Package,
  PackagePlus,
} from 'lucide-react';

interface PendingPOPanelProps {
  filteredPendingPOs: PurchaseOrder[];
  expandedPOs: Set<string>;
  supplierById: Map<string, Supplier>;
  materialById: Map<string, Material>;
  today: string;
  baseTimeMs: number;
  togglePO: (poId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

export function PendingPOPanel({
  filteredPendingPOs,
  expandedPOs,
  supplierById,
  materialById,
  today,
  baseTimeMs,
  togglePO,
  expandAll,
  collapseAll,
}: PendingPOPanelProps) {
  return (
    <div>
      {filteredPendingPOs.length > 0 && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={expandAll}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            전체 펼치기
          </button>
          <span className="text-xs text-muted-foreground">|</span>
          <button
            onClick={collapseAll}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            전체 접기
          </button>
        </div>
      )}

      {filteredPendingPOs.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">미입고 발주가 없습니다</p>
          <p className="text-sm mt-1">모든 발주가 입고 완료되었습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPendingPOs.map((purchaseOrder) => {
            const supplier = supplierById.get(purchaseOrder.supplier_id);
            const isExpanded = expandedPOs.has(purchaseOrder.id);
            const isOverdue = purchaseOrder.due_date ? purchaseOrder.due_date < today : false;
            const daysUntilDue = purchaseOrder.due_date
              ? Math.ceil(
                  (new Date(purchaseOrder.due_date).getTime() - baseTimeMs) /
                    (1000 * 60 * 60 * 24),
                )
              : null;

            const totalOrdered = purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0);
            const totalReceived = purchaseOrder.items.reduce((sum, item) => {
              return sum + (item.received_quantity || 0);
            }, 0);
            const progressPct =
              totalOrdered > 0
                ? Math.round((totalReceived / totalOrdered) * 100)
                : 0;
            const remainingAmount = purchaseOrder.items.reduce((sum, item) => {
              return sum + (item.quantity - (item.received_quantity || 0)) * item.unit_price;
            }, 0);

            return (
              <div
                key={purchaseOrder.id}
                className={`rounded-lg border bg-card overflow-hidden ${
                  isOverdue ? 'border-red-300' : 'border-border'
                }`}
              >
                <button
                  onClick={() => togglePO(purchaseOrder.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="shrink-0">
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-muted-foreground" />
                    ) : (
                      <ChevronRight size={16} className="text-muted-foreground" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold">{purchaseOrder.po_no}</span>
                      <StatusBadge status={purchaseOrder.status} statusMap={PO_STATUS_MAP} />
                      {isOverdue && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <AlertTriangle size={10} />
                          납기초과
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {supplier?.name || '알 수 없음'}
                    </p>
                  </div>

                  <div className="text-right shrink-0 w-28">
                    <p className="text-xs text-muted-foreground mb-0.5">납기일</p>
                    <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                      {purchaseOrder.due_date
                        ? new Date(purchaseOrder.due_date).toLocaleDateString('ko-KR')
                        : '-'}
                    </p>
                    {daysUntilDue !== null && (
                      <p
                        className={`text-xs ${
                          daysUntilDue < 0
                            ? 'text-red-500'
                            : daysUntilDue <= 3
                              ? 'text-orange-500'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {daysUntilDue < 0
                          ? `${Math.abs(daysUntilDue)}일 초과`
                          : daysUntilDue === 0
                            ? '오늘 마감'
                            : `${daysUntilDue}일 남음`}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 w-32">
                    <p className="text-xs text-muted-foreground mb-1.5">입고 진행률</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            progressPct >= 100
                              ? 'bg-green-500'
                              : progressPct > 0
                                ? 'bg-blue-500'
                                : 'bg-gray-300'
                          }`}
                          style={{ width: `${Math.min(progressPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{progressPct}%</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 w-28">
                    <p className="text-xs text-muted-foreground mb-0.5">미입고 금액</p>
                    <p className="text-sm font-bold">
                      {(remainingAmount / 10000).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                      <span className="text-xs font-normal text-muted-foreground ml-0.5">만원</span>
                    </p>
                  </div>

                  <Link
                    href={`/materials/receiving/new?po=${purchaseOrder.id}`}
                    onClick={(event) => event.stopPropagation()}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90"
                  >
                    <PackagePlus size={12} />
                    입고처리
                  </Link>
                </button>

                {isExpanded && (
                  <div className="border-t border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border">
                          <th className="px-5 py-2.5 text-left font-medium text-muted-foreground text-xs">자재코드</th>
                          <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">자재명</th>
                          <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">발주수량</th>
                          <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">입고수량</th>
                          <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">잔량</th>
                          <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">단가</th>
                          <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">미입고 금액</th>
                          <th className="px-4 py-2.5 font-medium text-muted-foreground text-xs w-24">진행률</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseOrder.items.map((item) => {
                          const material = materialById.get(item.material_id);
                          const received = item.received_quantity || 0;
                          const remaining = item.quantity - received;
                          const pct =
                            item.quantity > 0
                              ? Math.round((received / item.quantity) * 100)
                              : 0;
                          const itemRemainingAmount = remaining * item.unit_price;
                          return (
                            <tr
                              key={item.id}
                              className="border-b border-border last:border-0 hover:bg-muted/20"
                            >
                              <td className="px-5 py-2.5">
                                <span className="font-mono text-xs">{material?.material_code || '-'}</span>
                              </td>
                              <td className="px-4 py-2.5 font-medium">{material?.name || '-'}</td>
                              <td className="px-4 py-2.5 text-right">{item.quantity.toLocaleString()}</td>
                              <td className="px-4 py-2.5 text-right text-green-600 font-medium">{received.toLocaleString()}</td>
                              <td className="px-4 py-2.5 text-right">
                                <span
                                  className={remaining > 0 ? 'text-orange-600 font-bold' : 'text-muted-foreground'}
                                >
                                  {remaining.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-right">{item.unit_price.toLocaleString()}원</td>
                              <td className="px-4 py-2.5 text-right font-medium">
                                {itemRemainingAmount > 0
                                  ? `${itemRemainingAmount.toLocaleString()}원`
                                  : '-'}
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        pct >= 100
                                          ? 'bg-green-500'
                                          : pct > 0
                                            ? 'bg-blue-500'
                                            : 'bg-gray-200'
                                      }`}
                                      style={{ width: `${Math.min(pct, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground w-7 text-right">{pct}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="px-5 py-2.5 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        발주일: {new Date(purchaseOrder.order_date).toLocaleDateString('ko-KR')}
                        {purchaseOrder.notes && <> · 비고: {purchaseOrder.notes}</>}
                      </span>
                      <Link
                        href={`/materials/purchase-orders/${purchaseOrder.id}`}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        발주 상세보기 <ExternalLink size={10} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
