'use client';

import React, { useMemo } from 'react';
import { useAPItems } from '@/hooks/accounting/useAPItems';
import { useSuppliers } from '@/hooks/procurement/useSuppliers';
import { usePurchaseOrders } from '@/hooks/procurement/usePurchaseOrders';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import { AP_STATUS_MAP } from '@/types';
import { CreditCard, AlertCircle } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('ko-KR').format(n);

function getDaysOverdue(dueDate: string): number {
  const today = new Date();
  const due = new Date(dueDate);
  const diff = today.getTime() - due.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function getAgingBucket(days: number): string {
  if (days <= 30) return '30일 이내';
  if (days <= 60) return '31-60일';
  if (days <= 90) return '61-90일';
  return '90일 초과';
}

function getAgingColor(days: number): string {
  if (days > 90) return 'text-red-600 font-medium';
  if (days > 60) return 'text-yellow-600 font-medium';
  return '';
}

export default function PayablesPage() {
  const { apOpenItems } = useAPItems();
  const { suppliers } = useSuppliers();
  const { purchaseOrders } = usePurchaseOrders();

  const supplierById = useMemo(() => new Map(suppliers.map(s => [s.id, s])), [suppliers]);
  const poById = useMemo(() => new Map(purchaseOrders.map(p => [p.id, p])), [purchaseOrders]);

  const activeItems = useMemo(() => apOpenItems.filter(a => a.status !== 'CLOSED'), [apOpenItems]);
  const totalBalance = useMemo(() => activeItems.reduce((s, a) => s + a.balance_amount, 0), [activeItems]);
  const openCount = activeItems.length;

  const sortedItems = useMemo(
    () => [...apOpenItems].sort((a, b) => {
      if (a.status === 'CLOSED' && b.status !== 'CLOSED') return 1;
      if (a.status !== 'CLOSED' && b.status === 'CLOSED') return -1;
      return getDaysOverdue(b.due_date) - getDaysOverdue(a.due_date);
    }),
    [apOpenItems],
  );

  return (
    <div>
      <PageHeader title="매입채무" description="거래처별 매입채무 에이징 현황을 관리합니다" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
          <div className="p-2 rounded-md bg-red-100 text-red-700"><CreditCard size={20} /></div>
          <div>
            <p className="text-xs text-muted-foreground">총 미지급금</p>
            <p className="text-xl font-bold">{fmt(totalBalance)}원</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
          <div className="p-2 rounded-md bg-yellow-100 text-yellow-700"><AlertCircle size={20} /></div>
          <div>
            <p className="text-xs text-muted-foreground">미결 건수</p>
            <p className="text-xl font-bold">{openCount}건</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">거래처명</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">발주번호</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">원금</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">잔액</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">만기일</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">경과일</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">구간</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">상태</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map(ap => {
              const days = ap.status !== 'CLOSED' ? getDaysOverdue(ap.due_date) : 0;
              const po = poById.get(ap.purchase_order_id);
              return (
                <tr key={ap.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">{supplierById.get(ap.supplier_id)?.name || '-'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{po?.po_no || '-'}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(ap.original_amount)}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(ap.balance_amount)}</td>
                  <td className="px-4 py-3">{ap.due_date}</td>
                  <td className={`px-4 py-3 text-right ${getAgingColor(days)}`}>
                    {ap.status !== 'CLOSED' ? `${days}일` : '-'}
                  </td>
                  <td className={`px-4 py-3 ${getAgingColor(days)}`}>
                    {ap.status !== 'CLOSED' ? getAgingBucket(days) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={ap.status} statusMap={AP_STATUS_MAP} />
                  </td>
                </tr>
              );
            })}
            {sortedItems.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">매입채무 데이터가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">총 {sortedItems.length}건</div>
    </div>
  );
}
