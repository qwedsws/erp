'use client';

import React, { useMemo } from 'react';
import { useARItems } from '@/hooks/accounting/useARItems';
import { useCustomers } from '@/hooks/sales/useCustomers';
import { useOrders } from '@/hooks/sales/useOrders';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import { AR_STATUS_MAP } from '@/types';
import { Wallet, AlertCircle, TrendingUp } from 'lucide-react';

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

export default function ReceivablesPage() {
  const { arOpenItems } = useARItems();
  const { customers } = useCustomers();
  const { orders } = useOrders();

  const customerById = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);
  const orderById = useMemo(() => new Map(orders.map(o => [o.id, o])), [orders]);

  const activeItems = useMemo(() => arOpenItems.filter(a => a.status !== 'CLOSED'), [arOpenItems]);
  const totalBalance = useMemo(() => activeItems.reduce((s, a) => s + a.balance_amount, 0), [activeItems]);
  const openCount = useMemo(() => activeItems.filter(a => a.status === 'OPEN').length, [activeItems]);
  const collectionRate = useMemo(() => {
    const totalOriginal = arOpenItems.reduce((s, a) => s + a.original_amount, 0);
    const totalCollected = arOpenItems.reduce((s, a) => s + (a.original_amount - a.balance_amount), 0);
    return totalOriginal > 0 ? Math.round((totalCollected / totalOriginal) * 100) : 0;
  }, [arOpenItems]);

  const sortedItems = useMemo(
    () => [...arOpenItems].sort((a, b) => {
      if (a.status === 'CLOSED' && b.status !== 'CLOSED') return 1;
      if (a.status !== 'CLOSED' && b.status === 'CLOSED') return -1;
      return getDaysOverdue(b.due_date) - getDaysOverdue(a.due_date);
    }),
    [arOpenItems],
  );

  return (
    <div>
      <PageHeader title="매출채권" description="고객별 매출채권 에이징 현황을 관리합니다" />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
          <div className="p-2 rounded-md bg-blue-100 text-blue-700"><Wallet size={20} /></div>
          <div>
            <p className="text-xs text-muted-foreground">총 미수금</p>
            <p className="text-xl font-bold">{fmt(totalBalance)}원</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
          <div className="p-2 rounded-md bg-red-100 text-red-700"><AlertCircle size={20} /></div>
          <div>
            <p className="text-xs text-muted-foreground">OPEN 건수</p>
            <p className="text-xl font-bold">{openCount}건</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
          <div className="p-2 rounded-md bg-green-100 text-green-700"><TrendingUp size={20} /></div>
          <div>
            <p className="text-xs text-muted-foreground">수금률</p>
            <p className="text-xl font-bold">{collectionRate}%</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">고객명</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">수주번호</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">원금</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">잔액</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">만기일</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">경과일</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">구간</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">상태</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map(ar => {
              const days = ar.status !== 'CLOSED' ? getDaysOverdue(ar.due_date) : 0;
              const order = orderById.get(ar.order_id);
              return (
                <tr key={ar.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">{customerById.get(ar.customer_id)?.name || '-'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{order?.order_no || '-'}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(ar.original_amount)}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(ar.balance_amount)}</td>
                  <td className="px-4 py-3">{ar.due_date}</td>
                  <td className={`px-4 py-3 text-right ${getAgingColor(days)}`}>
                    {ar.status !== 'CLOSED' ? `${days}일` : '-'}
                  </td>
                  <td className={`px-4 py-3 ${getAgingColor(days)}`}>
                    {ar.status !== 'CLOSED' ? getAgingBucket(days) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={ar.status} statusMap={AR_STATUS_MAP} />
                  </td>
                </tr>
              );
            })}
            {sortedItems.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">매출채권 데이터가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">총 {sortedItems.length}건</div>
    </div>
  );
}
