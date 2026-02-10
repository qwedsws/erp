'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/common/page-header';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useReceivingPageData } from '@/hooks/materials/useReceivingPageData';
import { Plus, Search } from 'lucide-react';
import { PendingPOPanel } from './_components/pending-po-panel';

export default function ReceivingPage() {
  const {
    search,
    setSearch,
    materialById,
    supplierById,
    baseTimeMs,
    today,
    filteredPendingPOs,
    confirmPOAction,
    targetPO,
    openCancelDialog,
    openDeleteDialog,
    closePOActionDialog,
    confirmPOActionHandler,
  } = useReceivingPageData();

  return (
    <div>
      <PageHeader
        title="입고 관리"
        description="발주별 미입고 현황을 관리합니다"
        actions={
          <Link
            href="/materials/receiving/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            <Plus size={16} />
            입고 등록
          </Link>
        }
      />

      <div className="flex items-center justify-end mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="발주번호, 거래처, 자재명 검색..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-8 w-64 rounded-md border border-input bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <PendingPOPanel
        filteredPendingPOs={filteredPendingPOs}
        supplierById={supplierById}
        materialById={materialById}
        today={today}
        baseTimeMs={baseTimeMs}
        onCancelPO={openCancelDialog}
        onDeletePO={openDeleteDialog}
      />

      <ConfirmDialog
        open={confirmPOAction !== null}
        onOpenChange={closePOActionDialog}
        title={confirmPOAction === 'cancel' ? '발주를 취소하시겠습니까?' : '발주를 삭제하시겠습니까?'}
        description={
          confirmPOAction === 'cancel'
            ? `발주 ${targetPO?.po_no ?? ''}를 취소 처리합니다.`
            : `발주 ${targetPO?.po_no ?? ''}를 삭제하면 복구할 수 없습니다.`
        }
        confirmLabel={confirmPOAction === 'cancel' ? '발주 취소' : '삭제'}
        cancelLabel="닫기"
        confirmVariant={confirmPOAction === 'cancel' ? 'default' : 'destructive'}
        onConfirm={() => void confirmPOActionHandler()}
      />
    </div>
  );
}
