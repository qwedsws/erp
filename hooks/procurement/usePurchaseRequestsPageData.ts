'use client';

import { useState, useMemo, useCallback } from 'react';
import { useMaterials } from '@/hooks/materials/useMaterials';
import { useProfiles } from '@/hooks/admin/useProfiles';
import { useSuppliers } from '@/hooks/procurement/useSuppliers';
import { usePurchaseRequests } from '@/hooks/procurement/usePurchaseRequests';
import { usePurchaseRequestListQuery } from '@/hooks/procurement/usePurchaseRequestListQuery';
import { useFeedbackToast } from '@/hooks/shared/useFeedbackToast';
import type { PurchaseRequestStatus } from '@/domain/shared/entities';

// --- Public types ---

export type StatusTab = PurchaseRequestStatus | 'ALL';

export interface KpiCounts {
  total: number;
  inProgress: number;
  approved: number;
  completed: number;
}

// --- Constants ---

export const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'DRAFT', label: '작성중' },
  { key: 'IN_PROGRESS', label: '진행중' },
  { key: 'APPROVED', label: '승인' },
  { key: 'REJECTED', label: '반려' },
  { key: 'COMPLETED', label: '완료' },
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
    revokePurchaseRequest,
    deletePurchaseRequest,
    convertRequestsToPO,
  } = usePurchaseRequests();
  const listQuery = usePurchaseRequestListQuery();
  const { showError, showInfo, showSuccess } = useFeedbackToast();

  // --- Local state ---
  const [statusFilter, setStatusFilter] = useState<StatusTab>('ALL');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [showConvertPanel, setShowConvertPanel] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectTargetIds, setRejectTargetIds] = useState<string[]>([]);
  const [rejectReason, setRejectReason] = useState('');
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [revokeTargetIds, setRevokeTargetIds] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTargetIds, setDeleteTargetIds] = useState<string[]>([]);

  // --- Derived data ---
  const materialById = useMemo(
    () => new Map(materials.map((m) => [m.id, m])),
    [materials],
  );
  const profileById = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    [profiles],
  );

  // KPI counts: total from server, status breakdowns from cache
  const kpiCounts = useMemo<KpiCounts>(() => {
    const total = listQuery.total;
    const inProgress = purchaseRequests.filter((pr) => pr.status === 'IN_PROGRESS').length;
    const approved = purchaseRequests.filter((pr) => pr.status === 'APPROVED').length;
    const completed = purchaseRequests.filter((pr) => pr.status === 'COMPLETED').length;
    return { total, inProgress, approved, completed };
  }, [listQuery.total, purchaseRequests]);

  // Server-side paginated items
  const items = listQuery.items;

  const approvedIds = useMemo(() => {
    return new Set(items.filter((pr) => pr.status === 'APPROVED').map((pr) => pr.id));
  }, [items]);

  const hasCheckedApproved = useMemo(() => {
    return [...checkedIds].some((id) => approvedIds.has(id));
  }, [checkedIds, approvedIds]);

  const checkedApprovedCount = useMemo(() => {
    return [...checkedIds].filter((id) => approvedIds.has(id)).length;
  }, [checkedIds, approvedIds]);

  // Selection counts for toolbar buttons
  const selectedPendingCount = useMemo(() => {
    return [...checkedIds].filter((id) => {
      const pr = items.find((p) => p.id === id);
      return pr?.status === 'IN_PROGRESS';
    }).length;
  }, [checkedIds, items]);

  const selectedCanRevokeCount = useMemo(() => {
    return [...checkedIds].filter((id) => {
      const pr = items.find((p) => p.id === id);
      return pr && (pr.status === 'APPROVED' || pr.status === 'REJECTED');
    }).length;
  }, [checkedIds, items]);

  const selectedCanDeleteCount = useMemo(() => {
    return [...checkedIds].filter((id) => {
      const pr = items.find((p) => p.id === id);
      return pr && pr.status !== 'COMPLETED';
    }).length;
  }, [checkedIds, items]);

  // --- Status filter synced with server query ---
  const handleSetStatusFilter = useCallback(
    (tab: StatusTab) => {
      setStatusFilter(tab);
      listQuery.setStatus(tab === 'ALL' ? undefined : tab);
    },
    [listQuery],
  );

  // --- Handlers: Batch approve (direct, no dialog) ---
  const batchApprove = useCallback(async () => {
    const pendingIds = [...checkedIds].filter((id) => {
      const pr = items.find((p) => p.id === id);
      return pr?.status === 'IN_PROGRESS';
    });
    if (pendingIds.length === 0) {
      showInfo('승인할 대기 건이 없습니다.');
      return;
    }
    let successCount = 0;
    for (const id of pendingIds) {
      const result = await approvePurchaseRequest(id);
      if (result.ok) successCount++;
    }
    if (successCount > 0) {
      showSuccess(`${successCount}건의 구매 요청을 승인했습니다.`);
      setCheckedIds((prev) => {
        const next = new Set(prev);
        pendingIds.forEach((id) => next.delete(id));
        return next;
      });
      listQuery.refresh();
    }
  }, [checkedIds, items, approvePurchaseRequest, showInfo, showSuccess, listQuery]);

  // --- Handlers: Reject dialog ---
  const openRejectDialog = useCallback(() => {
    const pendingIds = [...checkedIds].filter((id) => {
      const pr = items.find((p) => p.id === id);
      return pr?.status === 'IN_PROGRESS';
    });
    if (pendingIds.length === 0) {
      showInfo('반려할 대기 건이 없습니다.');
      return;
    }
    setRejectTargetIds(pendingIds);
    setRejectReason('');
    setIsRejectDialogOpen(true);
  }, [checkedIds, items, showInfo]);

  const closeRejectDialog = useCallback((open: boolean) => {
    setIsRejectDialogOpen(open);
    if (!open) {
      setRejectTargetIds([]);
      setRejectReason('');
    }
  }, []);

  const confirmReject = useCallback(async () => {
    if (rejectTargetIds.length === 0) return;
    const reason = rejectReason.trim();
    if (!reason) {
      showInfo('반려 사유를 입력하세요.');
      return;
    }
    let successCount = 0;
    for (const id of rejectTargetIds) {
      const result = await rejectPurchaseRequest(id, reason);
      if (result.ok) successCount++;
    }
    if (successCount > 0) {
      showSuccess(`${successCount}건의 구매 요청을 반려했습니다.`);
      setIsRejectDialogOpen(false);
      setCheckedIds((prev) => {
        const next = new Set(prev);
        rejectTargetIds.forEach((id) => next.delete(id));
        return next;
      });
      setRejectTargetIds([]);
      setRejectReason('');
      listQuery.refresh();
    } else {
      showError('반려 처리에 실패했습니다.');
    }
  }, [rejectTargetIds, rejectReason, rejectPurchaseRequest, showError, showInfo, showSuccess, listQuery]);

  // --- Handlers: Revoke ---
  const openRevokeDialog = useCallback(() => {
    const revokeIds = [...checkedIds].filter((id) => {
      const pr = items.find((p) => p.id === id);
      return pr && (pr.status === 'APPROVED' || pr.status === 'REJECTED');
    });
    if (revokeIds.length === 0) {
      showInfo('철회할 승인/반려 건이 없습니다.');
      return;
    }
    setRevokeTargetIds(revokeIds);
    setIsRevokeDialogOpen(true);
  }, [checkedIds, items, showInfo]);

  const closeRevokeDialog = useCallback((open: boolean) => {
    setIsRevokeDialogOpen(open);
    if (!open) setRevokeTargetIds([]);
  }, []);

  const confirmRevoke = useCallback(async () => {
    if (revokeTargetIds.length === 0) return;
    let successCount = 0;
    for (const id of revokeTargetIds) {
      const result = await revokePurchaseRequest(id);
      if (result.ok) successCount++;
    }
    if (successCount > 0) {
      showSuccess(`${successCount}건의 승인/반려를 철회했습니다.`);
      setIsRevokeDialogOpen(false);
      setCheckedIds((prev) => {
        const next = new Set(prev);
        revokeTargetIds.forEach((id) => next.delete(id));
        return next;
      });
      setRevokeTargetIds([]);
      listQuery.refresh();
    } else {
      showError('철회 처리에 실패했습니다.');
    }
  }, [revokeTargetIds, revokePurchaseRequest, showError, showSuccess, listQuery]);

  // --- Handlers: Delete ---
  const openDeleteDialog = useCallback(() => {
    const deletableIds = [...checkedIds].filter((id) => {
      const pr = items.find((p) => p.id === id);
      return pr && pr.status !== 'COMPLETED';
    });
    if (deletableIds.length === 0) {
      showInfo('삭제할 수 있는 건이 없습니다.');
      return;
    }
    setDeleteTargetIds(deletableIds);
    setIsDeleteDialogOpen(true);
  }, [checkedIds, items, showInfo]);

  const closeDeleteDialog = useCallback((open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) setDeleteTargetIds([]);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (deleteTargetIds.length === 0) return;
    let successCount = 0;
    for (const id of deleteTargetIds) {
      const result = await deletePurchaseRequest(id);
      if (result.ok) successCount++;
    }
    if (successCount > 0) {
      showSuccess(`${successCount}건의 구매 요청을 삭제했습니다.`);
      setIsDeleteDialogOpen(false);
      setCheckedIds((prev) => {
        const next = new Set(prev);
        deleteTargetIds.forEach((id) => next.delete(id));
        return next;
      });
      setDeleteTargetIds([]);
      listQuery.refresh();
    } else {
      showError('삭제 처리에 실패했습니다.');
    }
  }, [deleteTargetIds, deletePurchaseRequest, showError, showSuccess, listQuery]);

  // --- Handlers: Selection ---
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
      const allPageIds = items.map((pr) => pr.id);
      const allChecked = allPageIds.length > 0 && allPageIds.every((id) => prev.has(id));
      if (allChecked) {
        const next = new Set(prev);
        allPageIds.forEach((id) => next.delete(id));
        return next;
      } else {
        const next = new Set(prev);
        allPageIds.forEach((id) => next.add(id));
        return next;
      }
    });
  }, [items]);

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
    const pos = await convertRequestsToPO(ids, selectedSupplierId);
    if (pos.length === 0) {
      showError('발주 전환에 실패했습니다.');
      return;
    }
    const poNos = pos.map((p) => p.po_no).join(', ');
    showSuccess(
      pos.length === 1
        ? `발주 ${poNos}가 생성되었습니다.`
        : `발주 ${pos.length}건(${poNos})이 생성되었습니다.`,
      '발주 생성 완료',
    );
    setCheckedIds(new Set());
    setShowConvertPanel(false);
    setSelectedSupplierId('');
    listQuery.refresh();
  }, [checkedIds, approvedIds, selectedSupplierId, convertRequestsToPO, showError, showInfo, showSuccess, listQuery]);

  const hideConvertPanel = useCallback(() => {
    setShowConvertPanel(false);
    setSelectedSupplierId('');
  }, []);

  // --- Return composed view model ---
  return {
    // Data (server-side paginated)
    items,
    total: listQuery.total,
    page: listQuery.page,
    pageSize: listQuery.pageSize,
    isLoading: listQuery.isLoading,
    setPage: listQuery.setPage,
    setSearch: listQuery.setSearch,
    materialById,
    profileById,
    suppliers,
    kpiCounts,
    // Tab
    statusFilter,
    setStatusFilter: handleSetStatusFilter,
    // Selection
    checkedIds,
    approvedIds,
    hasCheckedApproved,
    checkedApprovedCount,
    toggleCheck,
    toggleAll,
    toggleAllApproved,
    selectSingleAndShowPanel,
    // Selection counts for toolbar
    selectedPendingCount,
    selectedCanRevokeCount,
    selectedCanDeleteCount,
    // Batch approve
    batchApprove,
    // Reject dialog
    isRejectDialogOpen,
    rejectTargetIds,
    rejectReason,
    openRejectDialog,
    closeRejectDialog,
    setRejectReason,
    confirmReject,
    // Revoke dialog
    isRevokeDialogOpen,
    revokeTargetIds,
    openRevokeDialog,
    closeRevokeDialog,
    confirmRevoke,
    // Delete dialog
    isDeleteDialogOpen,
    deleteTargetIds,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
    // Convert panel
    showConvertPanel,
    selectedSupplierId,
    setSelectedSupplierId,
    showConvertPanelAction: () => setShowConvertPanel(true),
    hideConvertPanel,
    handleConvert,
  };
}
