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
  completed: number;
}

// --- Constants ---

export const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'IN_PROGRESS', label: '진행중' },
  { key: 'COMPLETED', label: '완료' },
];

// --- Hook ---

export function usePurchaseRequestsPageData() {
  const { materials } = useMaterials();
  const { profiles } = useProfiles();
  const { suppliers } = useSuppliers();
  const {
    purchaseRequests,
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
    const completed = purchaseRequests.filter((pr) => pr.status === 'COMPLETED').length;
    return { total, inProgress, completed };
  }, [listQuery.total, purchaseRequests]);

  // Server-side paginated items
  const items = listQuery.items;

  const inProgressIds = useMemo(() => {
    return new Set(items.filter((pr) => pr.status === 'IN_PROGRESS').map((pr) => pr.id));
  }, [items]);

  const hasCheckedInProgress = useMemo(() => {
    return [...checkedIds].some((id) => inProgressIds.has(id));
  }, [checkedIds, inProgressIds]);

  const checkedInProgressCount = useMemo(() => {
    return [...checkedIds].filter((id) => inProgressIds.has(id)).length;
  }, [checkedIds, inProgressIds]);

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

  const toggleAllInProgress = useCallback(() => {
    setCheckedIds((prev) => {
      const allChecked = [...inProgressIds].every((id) => prev.has(id));
      if (allChecked) {
        const next = new Set(prev);
        inProgressIds.forEach((id) => next.delete(id));
        return next;
      } else {
        const next = new Set(prev);
        inProgressIds.forEach((id) => next.add(id));
        return next;
      }
    });
  }, [inProgressIds]);

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
    const ids = [...checkedIds].filter((id) => inProgressIds.has(id));
    if (ids.length === 0) {
      showInfo('발주 전환할 진행중 건을 선택하세요.');
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
  }, [checkedIds, inProgressIds, selectedSupplierId, convertRequestsToPO, showError, showInfo, showSuccess, listQuery]);

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
    inProgressIds,
    hasCheckedInProgress,
    checkedInProgressCount,
    toggleCheck,
    toggleAll,
    toggleAllInProgress,
    selectSingleAndShowPanel,
    // Selection counts for toolbar
    selectedCanDeleteCount,
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
