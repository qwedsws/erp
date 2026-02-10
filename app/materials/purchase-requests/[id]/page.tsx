'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { usePurchaseRequests } from '@/hooks/procurement/usePurchaseRequests';
import { useMaterials } from '@/hooks/materials/useMaterials';
import { useProfiles } from '@/hooks/admin/useProfiles';
import { useFeedbackToast } from '@/components/common/feedback-toast-provider';
import { PR_STATUS_MAP } from '@/types';
import { calcSteelWeight, calcSteelPrice } from '@/lib/utils';

export default function PurchaseRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const {
    purchaseRequests,
    deletePurchaseRequest,
  } = usePurchaseRequests();
  const { materials } = useMaterials();
  const { profiles } = useProfiles();
  const { showError, showSuccess } = useFeedbackToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const pr = useMemo(
    () => purchaseRequests.find((r) => r.id === id),
    [purchaseRequests, id],
  );
  const material = useMemo(
    () => (pr ? materials.find((m) => m.id === pr.material_id) : undefined),
    [materials, pr],
  );
  const requester = useMemo(
    () => (pr ? profiles.find((p) => p.id === pr.requested_by) : undefined),
    [profiles, pr],
  );

  const isSteel = material?.category === 'STEEL' && !!material.density && !!material.price_per_kg;
  const hasDims = pr?.dimension_w && pr?.dimension_l && pr?.dimension_h;

  const steelCalc = useMemo(() => {
    if (!isSteel || !material?.density || !material?.price_per_kg || !hasDims || !pr) {
      return { pieceWeight: 0, totalWeight: 0, estimatedAmount: 0 };
    }
    const pieceWeight = calcSteelWeight(material.density, pr.dimension_w!, pr.dimension_l!, pr.dimension_h!);
    const totalWeight = Math.round(pieceWeight * pr.quantity * 100) / 100;
    const estimatedAmount = totalWeight > 0 ? calcSteelPrice(totalWeight, material.price_per_kg) : 0;
    return { pieceWeight, totalWeight, estimatedAmount };
  }, [isSteel, material, hasDims, pr]);

  const navigateToList = () => router.push('/materials/purchase-requests');

  const confirmDelete = async () => {
    if (!pr) return;
    const result = await deletePurchaseRequest(pr.id);
    if (result.ok) {
      showSuccess('구매 요청을 삭제했습니다.');
      setIsDeleteDialogOpen(false);
      router.push('/materials/purchase-requests');
    } else {
      showError(result.error);
    }
  };

  if (!pr) {
    return (
      <div className="text-center py-12">
        <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">구매 요청을 찾을 수 없습니다.</p>
        <button onClick={navigateToList} className="mt-4 text-primary hover:underline text-sm">
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Back navigation */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={navigateToList} className="p-1 rounded hover:bg-accent">
          <ArrowLeft size={18} />
        </button>
        <span className="text-sm text-muted-foreground">구매 요청</span>
      </div>

      <PageHeader
        title={pr.pr_no}
        description={material?.name || '자재 미지정'}
        actions={
          pr.status === 'IN_PROGRESS' ? (
            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-300 text-red-700 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} />
              삭제
            </button>
          ) : pr.status === 'COMPLETED' && pr.po_id ? (
            <button
              onClick={() => router.push(`/materials/purchase-orders/${pr.po_id}`)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              발주 상세 보기
            </button>
          ) : undefined
        }
      />

      {/* Basic info card */}
      <div className="rounded-lg border border-border bg-card p-6 mb-6">
        <h3 className="font-semibold mb-4">요청 정보</h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div>
            <span className="text-muted-foreground">요청번호</span>
            <p className="font-mono mt-0.5">{pr.pr_no}</p>
          </div>
          <div>
            <span className="text-muted-foreground">상태</span>
            <div className="mt-0.5">
              <StatusBadge status={pr.status} statusMap={PR_STATUS_MAP} />
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">자재</span>
            <p className="font-medium mt-0.5">
              {material?.name || '-'}
              {material?.specification && (
                <span className="text-muted-foreground font-normal ml-2">({material.specification})</span>
              )}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">수량</span>
            <p className="font-medium mt-0.5">
              {pr.quantity.toLocaleString()} {material?.unit || ''}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">필요일</span>
            <p className="mt-0.5">{new Date(pr.required_date).toLocaleDateString('ko-KR')}</p>
          </div>
          <div>
            <span className="text-muted-foreground">요청자</span>
            <p className="mt-0.5">{requester?.name || '-'}</p>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">요청 사유</span>
            <p className="mt-0.5">{pr.reason || '-'}</p>
          </div>
          {pr.notes && (
            <div className="col-span-2">
              <span className="text-muted-foreground">비고</span>
              <p className="mt-0.5">{pr.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* STEEL dimension card */}
      {isSteel && hasDims && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-6 mb-6">
          <h3 className="font-semibold mb-4 text-blue-900 dark:text-blue-200">강재 치수 정보</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 text-sm">
            <div>
              <span className="text-blue-700 dark:text-blue-300">치수 (W×L×H)</span>
              <p className="font-mono font-medium mt-0.5 text-blue-900 dark:text-blue-100">
                {pr.dimension_w}×{pr.dimension_l}×{pr.dimension_h} mm
              </p>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300">강종</span>
              <p className="font-medium mt-0.5 text-blue-900 dark:text-blue-100">
                {material?.steel_grade || material?.name || '-'}
              </p>
            </div>
            {steelCalc.pieceWeight > 0 && (
              <>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">건당 중량</span>
                  <p className="font-medium mt-0.5 text-blue-900 dark:text-blue-100">
                    {steelCalc.pieceWeight.toFixed(3)} kg
                  </p>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">총 중량</span>
                  <p className="font-medium mt-0.5 text-blue-900 dark:text-blue-100">
                    {steelCalc.totalWeight.toFixed(2)} kg
                  </p>
                </div>
              </>
            )}
            {steelCalc.estimatedAmount > 0 && (
              <div className="col-span-2">
                <span className="text-blue-700 dark:text-blue-300">예상 금액</span>
                <p className="font-semibold text-lg mt-0.5 text-blue-900 dark:text-blue-100">
                  {steelCalc.estimatedAmount.toLocaleString()} 원
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Linked PO card */}
      {pr.po_id && (
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <h3 className="font-semibold mb-4">연결 발주</h3>
          <div className="text-sm">
            <button
              onClick={() => router.push(`/materials/purchase-orders/${pr.po_id}`)}
              className="text-primary hover:underline"
            >
              발주 상세 보기
            </button>
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>생성: {new Date(pr.created_at).toLocaleString('ko-KR')}</p>
        <p>수정: {new Date(pr.updated_at).toLocaleString('ko-KR')}</p>
      </div>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) setIsDeleteDialogOpen(false);
        }}
        title="구매 요청을 삭제하시겠습니까?"
        description="삭제된 구매 요청은 복구할 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        confirmVariant="destructive"
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
