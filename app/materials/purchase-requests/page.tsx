'use client';

import React, { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Loader2, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { TablePagination } from '@/components/common/table-pagination';
import { usePurchaseRequestsPageData } from '@/hooks/procurement/usePurchaseRequestsPageData';
import { StatusTabs } from './_components/status-tabs';
import { BatchConvertPanel } from './_components/batch-convert-panel';
import { PurchaseRequestsTable } from './_components/purchase-requests-table';

export default function PurchaseRequestsPage() {
  const {
    items,
    total,
    page,
    pageSize,
    isLoading,
    setPage,
    setSearch,
    materialById,
    profileById,
    suppliers,
    statusFilter,
    setStatusFilter,
    checkedIds,
    hasCheckedInProgress,
    checkedInProgressCount,
    toggleCheck,
    toggleAll,
    // Toolbar counts
    selectedCanDeleteCount,
    // Delete
    isDeleteDialogOpen,
    deleteTargetIds,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
    // Convert
    showConvertPanel,
    selectedSupplierId,
    setSelectedSupplierId,
    showConvertPanelAction,
    hideConvertPanel,
    handleConvert,
  } = usePurchaseRequestsPageData();

  const [searchInput, setSearchInput] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchInput(value);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        setSearch(value.trim());
      }, 300);
    },
    [setSearch],
  );

  const toggleConvertPanel = useCallback(() => {
    if (showConvertPanel) {
      hideConvertPanel();
    } else {
      showConvertPanelAction();
    }
  }, [showConvertPanel, hideConvertPanel, showConvertPanelAction]);

  return (
    <div>
      <PageHeader
        title="구매 요청"
        description="자재 구매 요청을 관리합니다"
        actions={
          <Link
            href="/materials/purchase-requests/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            <Plus size={16} />
            구매 요청 등록
          </Link>
        }
      />

      {/* Status filter tabs + search + batch convert toggle */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <StatusTabs
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            hasCheckedInProgress={hasCheckedInProgress}
            checkedInProgressCount={checkedInProgressCount}
            onToggleConvertPanel={toggleConvertPanel}
          />
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="검색..."
            value={searchInput}
            onChange={handleSearchChange}
            className="h-8 w-48 rounded-md border border-input bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Batch convert panel */}
      {showConvertPanel && (
        <BatchConvertPanel
          suppliers={suppliers}
          selectedSupplierId={selectedSupplierId}
          onSupplierChange={setSelectedSupplierId}
          onConvert={handleConvert}
          onCancel={hideConvertPanel}
        />
      )}

      {/* Toolbar for batch actions */}
      {checkedIds.size > 0 && (
        <div className="flex items-center gap-2 mb-3 p-3 bg-muted/30 rounded-lg border border-border">
          <span className="text-sm font-medium mr-2">{checkedIds.size}건 선택</span>
          <button
            onClick={openDeleteDialog}
            disabled={selectedCanDeleteCount === 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 size={14} />
            삭제 ({selectedCanDeleteCount})
          </button>
        </div>
      )}

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 size={20} className="animate-spin mr-2" />
          불러오는 중...
        </div>
      ) : (
        <PurchaseRequestsTable
          requests={items}
          materialById={materialById}
          profileById={profileById}
          checkedIds={checkedIds}
          onToggleCheck={toggleCheck}
          onToggleAll={toggleAll}
        />
      )}
      <TablePagination
        totalCount={total}
        currentPage={page}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={closeDeleteDialog}
        title="구매 요청을 삭제하시겠습니까?"
        description={`선택한 ${deleteTargetIds.length}건의 구매 요청을 삭제합니다. 이 작업은 복구할 수 없습니다.`}
        confirmLabel="삭제"
        cancelLabel="취소"
        confirmVariant="destructive"
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
