'use client';

import React from 'react';
import { PageHeader } from '@/components/common/page-header';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { usePurchaseOrderDetailViewModel } from '@/hooks/procurement/usePurchaseOrderDetailViewModel';
import { POHeaderActions } from './_components/po-header-actions';
import { POBasicInfoCard } from './_components/po-basic-info-card';
import { POItemsTable } from './_components/po-items-table';
import { POReceivingHistoryCard } from './_components/po-receiving-history-card';
import { ArrowLeft, FileText } from 'lucide-react';

export default function PurchaseOrderDetailPage() {
  const vm = usePurchaseOrderDetailViewModel();

  if (!vm.po) {
    return (
      <div className="text-center py-12">
        <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">발주를 찾을 수 없습니다.</p>
        <button
          onClick={vm.navigateToList}
          className="mt-4 text-primary hover:underline text-sm"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* 뒤로가기 */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={vm.navigateToList}
          className="p-1 rounded hover:bg-accent"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="text-sm text-muted-foreground">발주 관리</span>
      </div>

      <PageHeader
        title={vm.po.po_no}
        description={vm.supplier?.name || '공급처 미지정'}
        actions={
          <POHeaderActions
            poId={vm.po.id}
            status={vm.po.status}
            isEditing={vm.isEditing}
            onSaveEdit={() => void vm.handleSaveEdit()}
            onCancelEdit={vm.handleCancelEdit}
            onStartEdit={vm.handleStartEdit}
            onConfirmOrder={() => void vm.handleConfirmOrder()}
            onDelete={vm.handleDelete}
            onCancelOrder={vm.handleCancelOrder}
          />
        }
      />

      <POBasicInfoCard
        po={vm.po}
        supplier={vm.supplier}
        creator={vm.creator}
        suppliers={vm.suppliers}
        isEditing={vm.isEditing}
        editForm={vm.editForm}
        onEditChange={vm.handleEditChange}
      />

      <POItemsTable
        items={vm.itemsWithDetails}
        totals={vm.totals}
      />

      <POReceivingHistoryCard
        receivingHistory={vm.receivingHistory}
        materialById={vm.materialById}
      />

      <ConfirmDialog
        open={vm.confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) vm.setConfirmAction(null);
        }}
        title={
          vm.confirmAction === 'cancel'
            ? '발주를 취소하시겠습니까?'
            : '발주를 삭제하시겠습니까?'
        }
        description={
          vm.confirmAction === 'cancel'
            ? '취소 후에는 발주를 다시 진행할 수 없습니다.'
            : '삭제된 발주는 복구할 수 없습니다.'
        }
        confirmLabel={vm.confirmAction === 'cancel' ? '발주 취소' : '삭제'}
        cancelLabel="닫기"
        confirmVariant="destructive"
        onConfirm={() => void vm.handleConfirmAction()}
      />
    </div>
  );
}
