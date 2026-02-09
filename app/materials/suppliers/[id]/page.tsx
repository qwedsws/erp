'use client';

import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/common/page-header';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useSupplierDetailViewModel } from '@/hooks/procurement/useSupplierDetailViewModel';
import { ArrowLeft, Pencil, Save, Trash2, X } from 'lucide-react';
import { SupplierBasicInfoCard } from './_components/supplier-basic-info-card';
import { SupplierPOHistoryCard } from './_components/supplier-po-history-card';
import { SupplierMaterialsCard } from './_components/supplier-materials-card';
import { SupplierStatsCard } from './_components/supplier-stats-card';

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = typeof params.id === 'string' ? params.id : params.id?.[0];
  const {
    supplier,
    supplierPOs,
    supplierMaterials,
    stats,
    isEditing,
    editForm,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleEditChange,
    handleDelete,
  } = useSupplierDetailViewModel(supplierId);

  if (!supplier) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">거래처를 찾을 수 없습니다.</p>
        <button onClick={() => router.push('/materials/suppliers')} className="mt-4 text-primary hover:underline text-sm">
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const handleConfirmDelete = async () => {
    const deleted = await handleDelete();
    if (deleted) {
      router.push('/materials/suppliers');
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.push('/materials/suppliers')} className="p-1 rounded hover:bg-accent">
          <ArrowLeft size={18} />
        </button>
        <span className="text-sm text-muted-foreground">거래처 관리</span>
      </div>
      <PageHeader
        title={supplier.name}
        description={supplier.business_no || '사업자번호 없음'}
        actions={
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => void handleSaveEdit()}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
                >
                  <Save size={14} /> 저장
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-input rounded-md text-sm hover:bg-accent"
                >
                  <X size={14} /> 취소
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleStartEdit}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-input rounded-md text-sm hover:bg-accent"
                >
                  <Pencil size={14} /> 수정
                </button>
                <button
                  onClick={() => setDeleteDialogOpen(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-destructive text-destructive rounded-md text-sm hover:bg-destructive/10"
                >
                  <Trash2 size={14} /> 삭제
                </button>
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SupplierBasicInfoCard
            supplier={supplier}
            isEditing={isEditing}
            editForm={editForm}
            onEditChange={handleEditChange}
          />
          <SupplierPOHistoryCard
            supplierPOs={supplierPOs}
            onOpenPurchaseOrder={(purchaseOrderId) => router.push(`/materials/purchase-orders/${purchaseOrderId}`)}
          />
        </div>

        <div className="space-y-6">
          <SupplierMaterialsCard
            supplierMaterials={supplierMaterials}
            onOpenMaterial={(materialId) => router.push(`/materials/items/${materialId}`)}
          />
          <SupplierStatsCard stats={stats} />
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="거래처 삭제"
        description={`'${supplier.name}'을(를) 삭제하시겠습니까?`}
        confirmLabel="삭제"
        confirmVariant="destructive"
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}
