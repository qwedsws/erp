'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePurchaseOrders } from '@/hooks/procurement/usePurchaseOrders';
import { useSuppliers } from '@/hooks/procurement/useSuppliers';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import { PO_STATUS_MAP, PurchaseOrderStatus } from '@/types';
import { Plus, Filter } from 'lucide-react';

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const { purchaseOrders } = usePurchaseOrders();
  const { suppliers } = useSuppliers();
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const supplierById = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.id, supplier])),
    [suppliers],
  );

  const filtered = useMemo(() => {
    return purchaseOrders
      .filter(po => statusFilter === 'ALL' || po.status === statusFilter)
      .filter(po => {
        if (!search) return true;
        const lower = search.toLowerCase();
        const supplier = supplierById.get(po.supplier_id);
        return po.po_no.toLowerCase().includes(lower) ||
          (supplier?.name || '').toLowerCase().includes(lower);
      })
      .sort((a, b) => b.order_date.localeCompare(a.order_date));
  }, [purchaseOrders, supplierById, statusFilter, search]);

  const statusTabs: (PurchaseOrderStatus | 'ALL')[] = ['ALL', 'DRAFT', 'ORDERED', 'PARTIAL_RECEIVED', 'RECEIVED'];

  return (
    <div>
      <PageHeader
        title="발주 관리"
        description="구매 발주 현황을 관리합니다"
        actions={
          <Link
            href="/materials/purchase-orders/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            <Plus size={16} />
            발주 등록
          </Link>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1 text-sm">
          <Filter size={14} className="text-muted-foreground" />
          {statusTabs.map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {status === 'ALL' ? '전체' : PO_STATUS_MAP[status].label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="발주번호, 공급처 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto h-9 w-64 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">발주번호</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">공급처</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">발주일</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">납기일</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">금액</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(po => {
              const supplier = supplierById.get(po.supplier_id);
              return (
                <tr
                  key={po.id}
                  className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/30"
                  onClick={() => router.push(`/materials/purchase-orders/${po.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-xs">{po.po_no}</td>
                  <td className="px-4 py-3 font-medium">{supplier?.name || '-'}</td>
                  <td className="px-4 py-3">{po.order_date}</td>
                  <td className="px-4 py-3">{po.due_date || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    {po.total_amount != null ? `${po.total_amount.toLocaleString()}원` : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={po.status} statusMap={PO_STATUS_MAP} />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  발주 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">총 {filtered.length}건</div>
    </div>
  );
}
