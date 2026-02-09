'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { PromptDialog } from '@/components/common/prompt-dialog';
import { usePurchaseRequestsPageData } from '@/hooks/procurement/usePurchaseRequestsPageData';
import { StatusTabs } from './_components/status-tabs';
import { BatchConvertPanel } from './_components/batch-convert-panel';
import { PurchaseRequestsTable } from './_components/purchase-requests-table';

export default function PurchaseRequestsPage() {
  const {
    filteredRequests,
    materialById,
    profileById,
    suppliers,
    kpiCounts,
    statusFilter,
    setStatusFilter,
    checkedIds,
    approvedIds,
    hasCheckedApproved,
    checkedApprovedCount,
    toggleCheck,
    toggleAllApproved,
    selectSingleAndShowPanel,
    handleApprove,
    isRejectDialogOpen,
    rejectReason,
    openRejectDialog,
    closeRejectDialog,
    setRejectReason,
    confirmReject,
    showConvertPanel,
    selectedSupplierId,
    setSelectedSupplierId,
    showConvertPanelAction,
    hideConvertPanel,
    handleConvert,
  } = usePurchaseRequestsPageData();

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

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">전체 요청</p>
          <p className="text-2xl font-bold mt-1">{kpiCounts.total}</p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-700">승인 대기</p>
          <p className="text-2xl font-bold mt-1 text-yellow-800">{kpiCounts.pending}</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-700">승인 완료</p>
          <p className="text-2xl font-bold mt-1 text-green-800">{kpiCounts.approved}</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-700">발주 전환</p>
          <p className="text-2xl font-bold mt-1 text-blue-800">{kpiCounts.converted}</p>
        </div>
      </div>

      {/* Status filter tabs + batch convert toggle */}
      <StatusTabs
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        hasCheckedApproved={hasCheckedApproved}
        checkedApprovedCount={checkedApprovedCount}
        onToggleConvertPanel={toggleConvertPanel}
      />

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

      {/* Data table */}
      <PurchaseRequestsTable
        requests={filteredRequests}
        materialById={materialById}
        profileById={profileById}
        checkedIds={checkedIds}
        approvedIds={approvedIds}
        onToggleCheck={toggleCheck}
        onToggleAllApproved={toggleAllApproved}
        onApprove={handleApprove}
        onReject={openRejectDialog}
        onConvertSingle={selectSingleAndShowPanel}
      />

      {/* Reject dialog */}
      <PromptDialog
        open={isRejectDialogOpen}
        onOpenChange={closeRejectDialog}
        title="구매 요청 반려"
        description="반려 사유를 입력하면 요청 상태가 반려로 변경됩니다."
        inputLabel="반려 사유"
        placeholder="예: 사양 불일치"
        value={rejectReason}
        onValueChange={setRejectReason}
        confirmLabel="반려"
        cancelLabel="취소"
        confirmDisabled={!rejectReason.trim()}
        onConfirm={() => void confirmReject()}
      />
    </div>
  );
}
