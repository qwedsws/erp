'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCustomers } from '@/hooks/sales/useCustomers';
import { useOrders } from '@/hooks/sales/useOrders';
import { usePayments } from '@/hooks/sales/usePayments';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import { ORDER_STATUS_MAP, OrderStatus } from '@/types';
import { Plus, Filter } from 'lucide-react';

export default function OrdersPage() {
  const router = useRouter();
  const { orders } = useOrders();
  const { customers } = useCustomers();
  const { payments } = usePayments();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const customerById = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer])),
    [customers],
  );
  const confirmedPaidAmountByOrderId = useMemo(() => {
    const map = new Map<string, number>();
    for (const payment of payments) {
      if (payment.status !== 'CONFIRMED') continue;
      map.set(payment.order_id, (map.get(payment.order_id) ?? 0) + payment.amount);
    }
    return map;
  }, [payments]);

  const filtered = useMemo(() => {
    return orders
      .filter((order) => statusFilter === 'ALL' || order.status === statusFilter)
      .filter((order) => {
        if (!search) return true;
        const lower = search.toLowerCase();
        const customer = customerById.get(order.customer_id);
        return order.order_no.toLowerCase().includes(lower) ||
          order.title.toLowerCase().includes(lower) ||
          (customer?.name || '').toLowerCase().includes(lower);
      })
      .sort((a, b) => b.order_date.localeCompare(a.order_date));
  }, [orders, statusFilter, search, customerById]);

  return (
    <div>
      <PageHeader
        title="수주 관리"
        description="수주 현황을 관리합니다"
        actions={
          <Link
            href="/sales/orders/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            <Plus size={16} />
            수주 등록
          </Link>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1 text-sm">
          <Filter size={14} className="text-muted-foreground" />
          {(['ALL', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {status === 'ALL' ? '전체' : ORDER_STATUS_MAP[status].label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="수주번호, 제목, 고객명 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto h-9 w-64 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">수주번호</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">제목</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">고객</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">수주일</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">납기일</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">금액</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">입금</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(order => {
              const customer = customerById.get(order.customer_id);
              const isOverdue = new Date(order.delivery_date) < new Date() && order.status !== 'COMPLETED' && order.status !== 'CANCELLED';
              const paidAmount = confirmedPaidAmountByOrderId.get(order.id) ?? 0;
              const paidRate = order.total_amount && order.total_amount > 0 ? Math.round((paidAmount / order.total_amount) * 100) : 0;
              return (
                <tr
                  key={order.id}
                  className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/30"
                  onClick={() => router.push(`/sales/orders/${order.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-xs">{order.order_no}</td>
                  <td className="px-4 py-3 font-medium">{order.title}</td>
                  <td className="px-4 py-3">{customer?.name || '-'}</td>
                  <td className="px-4 py-3">{order.order_date}</td>
                  <td className={`px-4 py-3 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>{order.delivery_date}</td>
                  <td className="px-4 py-3 text-right">{order.total_amount ? `${(order.total_amount / 10000).toLocaleString()}만원` : '-'}</td>
                  <td className="px-4 py-3 text-center">
                    {order.total_amount ? (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        paidRate === 0 ? 'bg-gray-100 text-gray-600' :
                        paidRate >= 100 ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {paidRate === 0 ? '미입금' : paidRate >= 100 ? '완료' : `${paidRate}%`}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={order.status} statusMap={ORDER_STATUS_MAP} /></td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">수주 데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">총 {filtered.length}건</div>
    </div>
  );
}
