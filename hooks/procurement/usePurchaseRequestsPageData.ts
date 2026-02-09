'use client';

import { useState, useMemo, useCallback } from 'react';
import { useMaterials } from '@/hooks/materials/useMaterials';
import { useProfiles } from '@/hooks/admin/useProfiles';
import { useSuppliers } from '@/hooks/procurement/useSuppliers';
import { usePurchaseRequests } from '@/hooks/procurement/usePurchaseRequests';
import { useFeedbackToast } from '@/components/common/feedback-toast-provider';
import type { PurchaseRequestStatus } from '@/domain/shared/entities';

// --- Public types ---

export type StatusTab = PurchaseRequestStatus | 'ALL';

export interface KpiCounts {
  total: number;
  pending: number;
  approved: number;
  converted: number;
}

// --- Constants ---

export const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'DRAFT', label: '작성중' },
  { key: 'PENDING', label: '승인대기' },
  { key: 'APPROVED', label: '승인' },
  { key: 'REJECTED', label: '반려' },
  { key: 'CONVERTED', label: '발주전환' },
];

// --- Hook ---

export function usePurchaseRequestsPageData() {
  const { materials } = useMaterials();
  const { profiles } = useProfiles();
  const { suppliers } = useSuppliers();
  const {
    purchaseRequests,
    approvePurchaseRequest,
    rejectPurchaseRequest,
    convertRequestsToPO,
  } = usePurchaseRequests();
  const { showError, showInfo, showSuccess } = useFeedbackToast();

  // --- Local state ---
  const [statusFilter, setStatusFilter] = useState<StatusTab>('ALL');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [showConvertPanel, setShowConvertPanel] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // --- Derived data ---
  const materialById = useMemo(
    () => new Map(materials.map((m) => [m.id, m])),
    [materials],
  );
  const profileById = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    [profiles],
  );

  const kpiCounts = useMemo<KpiCounts>(() => {
    const total = purchaseRequests.length;
    const pending = purchaseRequests.filter((pr) => pr.status === 'PENDING').length;
    const approved = purchaseRequests.filter((pr) => pr.status === 'APPROVED').length;
    const converted = purchaseRequests.filter((pr) => pr.status === 'CONVERTED').length;
    return { total, pending, approved, converted };
  }, [purchaseRequests]);

  const filteredRequests = useMemo(() => {
    return purchaseRequests
      .filter((pr) => statusFilter === 'ALL' || pr.status === statusFilter)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [purchaseRequests, statusFilter]);

  const approvedIds = useMemo(() => {
    return new Set(filteredRequests.filter((pr) => pr.status === 'APPROVED').map((pr) => pr.id));
  }, [filteredRequests]);

  const hasCheckedApproved = useMemo(() => {
    return [...checkedIds].some((id) => approvedIds.has(id));
  }, [checkedIds, approvedIds]);

  const checkedApprovedCount = useMemo(() => {
    return [...checkedIds].filter((id) => approvedIds.has(id)).length;
  }, [checkedIds, approvedIds]);

  // --- Handlers: Approve ---
  const handleApprove = useCallback(
    async (id: string) => {
      const result = await approvePurchaseRequest(id);
      if (result.ok) {
        showSuccess('구매 요청을 승인했습니다.');
      } else {
        showError(result.error);
      }
    },
    [approvePurchaseRequest, showError, showSuccess],
  );

  // --- Handlers: Reject dialog ---
  const openRejectDialog = useCallback((id: string) => {
    setRejectTargetId(id);
    setRejectReason('');
    setIsRejectDialogOpen(true);
  }, []);

  const closeRejectDialog = useCallback((open: boolean) => {
    setIsRejectDialogOpen(open);
    if (!open) {
      setRejectTargetId(null);
      setRejectReason('');
    }
  }, []);

  const confirmReject = useCallback(async () => {
    if (!rejectTargetId) return;
    const reason = rejectReason.trim();
    if (!reason) {
      showInfo('반려 사유를 입력하세요.');
      return;
    }
    const result = await rejectPurchaseRequest(rejectTargetId, reason);
    if (result.ok) {
      showSuccess('구매 요청을 반려했습니다.');
      setIsRejectDialogOpen(false);
      setRejectTargetId(null);
      setRejectReason('');
    } else {
      showError(result.error);
    }
  }, [rejectReason, rejectPurchaseRequest, rejectTargetId, showError, showInfo, showSuccess]);

  // --- Handlers: Selection ---
  const toggleCheck = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAllApproved = useCallback(() => {
    setCheckedIds((prev) => {
      const allChecked = [...approvedIds].every((id) => prev.has(id));
      if (allChecked) {
        const next = new Set(prev);
        approvedIds.forEach((id) => next.delete(id));
        return next;
      } else {
        const next = new Set(prev);
        approvedIds.forEach((id) => next.add(id));
        return next;
      }
    });
  }, [approvedIds]);

  const selectSingleAndShowPanel = useCallback((id: string) => {
    setCheckedIds(new Set([id]));
    setShowConvertPanel(true);
  }, []);

  // --- Handlers: Convert panel ---
  const handleConvert = useCallback(async () => {
    if (!selectedSupplierId) {
      showInfo('공급처를 선택하세요.');
      return;
    }
    const ids = [...checkedIds].filter((id) => approvedIds.has(id));
    if (ids.length === 0) {
      showInfo('발주 전환할 승인 건을 선택하세요.');
      return;
    }
    const po = await convertRequestsToPO(ids, selectedSupplierId);
    if (!po) {
      showError('발주 전환에 실패했습니다.');
      return;
    }
    showSuccess(`발주 ${po.po_no}가 생성되었습니다.`, '발주 생성 완료');
    setCheckedIds(new Set());
    setShowConvertPanel(false);
    setSelectedSupplierId('');
  }, [checkedIds, approvedIds, selectedSupplierId, convertRequestsToPO, showError, showInfo, showSuccess]);

  const hideConvertPanel = useCallback(() => {
    setShowConvertPanel(false);
    setSelectedSupplierId('');
  }, []);

  // --- Return composed view model ---
  return {
    // Data
    filteredRequests,
    materialById,
    profileById,
    suppliers,
    kpiCounts,
    // Tab
    statusFilter,
    setStatusFilter,
    // Selection
    checkedIds,
    approvedIds,
    hasCheckedApproved,
    checkedApprovedCount,
    toggleCheck,
    toggleAllApproved,
    selectSingleAndShowPanel,
    // Approve
    handleApprove,
    // Reject dialog
    isRejectDialogOpen,
    rejectTargetId,
    rejectReason,
    openRejectDialog,
    closeRejectDialog,
    setRejectReason,
    confirmReject,
    // Convert panel
    showConvertPanel,
    selectedSupplierId,
    setSelectedSupplierId,
    showConvertPanelAction: () => setShowConvertPanel(true),
    hideConvertPanel,
    handleConvert,
  };
}
