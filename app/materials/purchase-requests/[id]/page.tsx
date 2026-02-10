'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Check, X } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import { PromptDialog } from '@/components/common/prompt-dialog';
import { usePurchaseRequests } from '@/hooks/procurement/usePurchaseRequests';
import { useMaterials } from '@/hooks/materials/useMaterials';
import { useProfiles } from '@/hooks/admin/useProfiles';
import { useFeedbackToast } from '@/components/common/feedback-toast-provider';
import { PR_STATUS_MAP } from '@/types';
import { calcSteelWeight, calcSteelPrice } from '@/lib/utils';

export default function PurchaseRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { purchaseRequests, approvePurchaseRequest, rejectPurchaseRequest } = usePurchaseRequests();
  const { materials } = useMaterials();
  const { profiles } = useProfiles();
  const { showError, showSuccess, showInfo } = useFeedbackToast();

  const [isRejectDialogOpen, setIsRejectDialogOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');

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
  const approver = useMemo(
    () => (pr?.approved_by ? profiles.find((p) => p.id === pr.approved_by) : undefined),
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

  const handleApprove = async () => {
    if (!pr) return;
    const result = await approvePurchaseRequest(pr.id);
    if (result.ok) showSuccess('구매 요청을 승인했습니다.');
    else showError(result.error);
  };

  const openRejectDialog = () => {
    setRejectReason('');
    setIsRejectDialogOpen(true);
  };

  const confirmReject = async () => {
    if (!pr) return;
    const reason = rejectReason.trim();
    if (!reason) {
      showInfo('반려 사유를 입력하세요.');
      return;
    }
    const result = await rejectPurchaseRequest(pr.id, reason);
    if (result.ok) {
      showSuccess('구매 요청을 반려했습니다.');
      setIsRejectDialogOpen(false);
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
          pr.status === 'PENDING' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => void handleApprove()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Check size={16} />
                승인
              </button>
              <button
                onClick={openRejectDialog}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <X size={16} />
                반려
              </button>
            </div>
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

      {/* Approval info card */}
      {(pr.status === 'APPROVED' || pr.status === 'REJECTED' || pr.status === 'CONVERTED') && (
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <h3 className="font-semibold mb-4">승인/반려 정보</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <span className="text-muted-foreground">처리자</span>
              <p className="mt-0.5">{approver?.name || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">처리일시</span>
              <p className="mt-0.5">
                {pr.approved_at ? new Date(pr.approved_at).toLocaleString('ko-KR') : '-'}
              </p>
            </div>
            {pr.reject_reason && (
              <div className="col-span-2">
                <span className="text-muted-foreground">반려 사유</span>
                <p className="mt-0.5 text-red-600">{pr.reject_reason}</p>
              </div>
            )}
            {pr.po_id && (
              <div>
                <span className="text-muted-foreground">연결 발주</span>
                <button
                  onClick={() => router.push(`/materials/purchase-orders/${pr.po_id}`)}
                  className="block mt-0.5 text-primary hover:underline"
                >
                  발주 상세 보기
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>생성: {new Date(pr.created_at).toLocaleString('ko-KR')}</p>
        <p>수정: {new Date(pr.updated_at).toLocaleString('ko-KR')}</p>
      </div>

      {/* Reject dialog */}
      <PromptDialog
        open={isRejectDialogOpen}
        onOpenChange={(open) => {
          setIsRejectDialogOpen(open);
          if (!open) setRejectReason('');
        }}
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
