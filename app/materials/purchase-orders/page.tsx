'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePurchaseOrderListQuery } from '@/hooks/procurement/usePurchaseOrderListQuery';
import { usePurchaseOrders } from '@/hooks/procurement/usePurchaseOrders';
import { useSuppliers } from '@/hooks/procurement/useSuppliers';
import { useMaterials } from '@/hooks/materials/useMaterials';
import { useFeedbackToast } from '@/hooks/shared/useFeedbackToast';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { TablePagination } from '@/components/common/table-pagination';
import { PO_STATUS_MAP, PurchaseOrderStatus } from '@/types';
import type { PurchaseOrder, Material } from '@/types';
import { Plus, Filter, Loader2, Trash2 } from 'lucide-react';

const PAGE_SIZE = 20;

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const {
    items, total, page, pageSize, isLoading, setPage, setSearch, setStatus, refresh,
  } = usePurchaseOrderListQuery({ pageSize: PAGE_SIZE });
  const { deletePurchaseOrder } = usePurchaseOrders();
  const { suppliers } = useSuppliers();
  const { materials } = useMaterials();
  const { showError, showSuccess } = useFeedbackToast();
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'ALL'>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const supplierById = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.id, supplier])),
    [suppliers],
  );

  const materialById = useMemo(
    () => new Map(materials.map((m) => [m.id, m])),
    [materials],
  );

  const statusTabs: (PurchaseOrderStatus | 'ALL')[] = ['ALL', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  const toggleCheck = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setCheckedIds((prev) => {
      if (prev.size === items.length && items.length > 0) return new Set();
      return new Set(items.map((po) => po.id));
    });
  }, [items]);

  const checkedCount = checkedIds.size;
  const allChecked = items.length > 0 && checkedIds.size === items.length;

  const handleBulkDelete = async () => {
    let successCount = 0;
    let failCount = 0;
    for (const id of checkedIds) {
      const result = await deletePurchaseOrder(id);
      if (result.ok) successCount++;
      else failCount++;
    }
    setShowDeleteDialog(false);
    setCheckedIds(new Set());
    refresh();
    if (failCount > 0) {
      showError(`${failCount}건 삭제 실패 (${successCount}건 삭제 완료)`);
    } else {
      showSuccess(`${successCount}건의 발주를 삭제했습니다.`);
    }
  };

  /** Build STEEL dimension summary for a PO, e.g. "NAK80 400×300×350 외" */
  function steelSummary(po: PurchaseOrder, matMap: Map<string, Material>): string | null {
    const steelItems = po.items.filter(
      (item) => item.dimension_w && item.dimension_l && item.dimension_h,
    );
    if (steelItems.length === 0) return null;
    const first = steelItems[0];
    const mat = matMap.get(first.material_id);
    const label = mat?.steel_grade || mat?.name || '';
    const dims = `${first.dimension_w}×${first.dimension_l}×${first.dimension_h}`;
    const suffix = steelItems.length > 1 ? ' 외' : '';
    return `${label} ${dims}${suffix}`;
  }

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
              onClick={() => {
                setStatusFilter(status);
                setStatus(status === 'ALL' ? undefined : status);
                setCheckedIds(new Set());
              }}
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
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setSearch(e.target.value);
            setCheckedIds(new Set());
          }}
          className="ml-auto h-9 w-64 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Bulk action bar */}
      {checkedCount > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2 rounded-lg bg-muted/50 border border-border">
          <span className="text-sm font-medium">{checkedCount}건 선택</span>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-destructive text-destructive-foreground rounded-md text-xs font-medium hover:bg-destructive/90 transition-colors"
          >
            <Trash2 size={14} />
            선택 삭제
          </button>
        </div>
      )}

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="rounded border-input"
                />
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">발주번호</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">공급처</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">발주일</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">납기일</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">금액</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">상태</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    데이터를 불러오는 중...
                  </span>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  발주 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              items.map(po => {
                const supplier = supplierById.get(po.supplier_id);
                const steelInfo = steelSummary(po, materialById);
                const checked = checkedIds.has(po.id);
                return (
                  <tr
                    key={po.id}
                    className={`border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 ${checked ? 'bg-primary/5' : ''}`}
                    onClick={() => router.push(`/materials/purchase-orders/${po.id}`)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCheck(po.id)}
                        className="rounded border-input"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs">{po.po_no}</span>
                      {steelInfo && (
                        <span className="block text-[11px] text-muted-foreground mt-0.5">
                          {po.items.length}건 · {steelInfo}
                        </span>
                      )}
                    </td>
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
              })
            )}
          </tbody>
        </table>
      </div>
      <TablePagination
        totalCount={total}
        currentPage={page}
        pageSize={pageSize}
        onPageChange={(p) => { setPage(p); setCheckedIds(new Set()); }}
      />

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={`${checkedCount}건의 발주를 삭제하시겠습니까?`}
        description="삭제하면 복구할 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        confirmVariant="destructive"
        onConfirm={() => void handleBulkDelete()}
      />
    </div>
  );
}
