'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMaterialListQuery } from '@/hooks/materials/useMaterialListQuery';
import { useMaterialDelete } from '@/hooks/materials/useMaterialDelete';
import { useStocks } from '@/hooks/materials/useStocks';
import { useSteelTags } from '@/hooks/procurement/useSteelTags';
import { useFeedbackToast } from '@/hooks/shared/useFeedbackToast';
import { PageHeader } from '@/components/common/page-header';
import { TablePagination } from '@/components/common/table-pagination';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Material, MaterialCategory, MATERIAL_CATEGORY_MAP, TOOL_TYPE_MAP, ToolType } from '@/types';
import { Plus, Package, Loader2, Search, Trash2, AlertTriangle } from 'lucide-react';

export default function MaterialItemsPage() {
  const router = useRouter();
  const { stocks } = useStocks();
  const { steelTags } = useSteelTags();
  const [activeCategory, setActiveCategory] = useState<MaterialCategory | 'ALL'>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { showSuccess, showError } = useFeedbackToast();

  const {
    items,
    total,
    page,
    pageSize,
    isLoading,
    setPage,
    setSearch,
    setCategory,
    refresh,
  } = useMaterialListQuery();

  const {
    deleteTargets,
    blockedItems,
    isChecking,
    isDeleting,
    isConfirmOpen,
    isDependencyModalOpen,
    requestDelete,
    confirmDelete,
    cancelDelete,
    setIsConfirmOpen,
    setIsDependencyModalOpen,
  } = useMaterialDelete({
    onDeleted: (count) => {
      showSuccess(`${count}건의 자재가 삭제되었습니다.`);
      setSelectedIds(new Set());
      refresh();
    },
    onError: (msg) => showError(msg),
  });

  const stockByMaterialId = useMemo(() => new Map(stocks.map(s => [s.material_id, s])), [stocks]);
  const steelAvailableStatsByMaterialId = useMemo(() => {
    const map = new Map<string, { count: number; totalWeight: number }>();
    for (const tag of steelTags) {
      if (tag.status !== 'AVAILABLE') continue;
      const existing = map.get(tag.material_id) ?? { count: 0, totalWeight: 0 };
      existing.count += 1;
      existing.totalWeight += tag.weight;
      map.set(tag.material_id, existing);
    }
    return map;
  }, [steelTags]);

  const isAllSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  }, [isAllSelected, items]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  function handleDeleteSelected() {
    const selected = items.filter((item) => selectedIds.has(item.id));
    if (selected.length === 0) return;
    void requestDelete(selected);
  }

  function handleCategoryChange(cat: MaterialCategory | 'ALL') {
    setActiveCategory(cat);
    setCategory(cat === 'ALL' ? undefined : cat);
    setSelectedIds(new Set());
  }

  function handleSearchChange(value: string) {
    setSearchInput(value);
    setSearch(value);
    setSelectedIds(new Set());
  }

  function renderSpecification(item: Material) {
    if (item.category === 'STEEL') {
      if (item.dimension_w && item.dimension_l && item.dimension_h) {
        return `${item.dimension_w}\u00D7${item.dimension_l}\u00D7${item.dimension_h}`;
      }
      return item.steel_grade
        ? `${item.steel_grade} (다양한 치수)`
        : '강재 (치수 미지정)';
    }
    if (item.category === 'TOOL' && item.tool_type) {
      return `\u03A6${item.tool_diameter} ${TOOL_TYPE_MAP[item.tool_type as ToolType]}`;
    }
    return item.specification || '-';
  }

  function renderStock(item: Material) {
    if (item.category === 'STEEL') {
      const stats = steelAvailableStatsByMaterialId.get(item.id);
      const count = stats?.count ?? 0;
      const totalWeight = stats?.totalWeight ?? 0;
      return `${count} EA (${totalWeight.toFixed(1)} kg)`;
    }
    const stock = stockByMaterialId.get(item.id);
    return `${stock?.quantity?.toLocaleString() || '0'} ${item.unit}`;
  }

  function renderUnitPrice(item: Material) {
    if (item.category === 'STEEL' && item.price_per_kg != null) {
      return `${item.price_per_kg.toLocaleString()}원/kg`;
    }
    return item.unit_price ? `${item.unit_price.toLocaleString()}원` : '-';
  }

  // Build dialog description text
  const confirmDescription = deleteTargets.length === 1
    ? `"${deleteTargets[0]?.name ?? ''}" 자재를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
    : `${deleteTargets.length}건의 자재를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`;

  const blockedDescription = (() => {
    if (blockedItems.length === 0) return '';
    if (deleteTargets.length === 1) {
      return `"${blockedItems[0]?.material.name}" 자재가 다른 데이터에서 사용 중이므로 삭제할 수 없습니다.`;
    }
    return `선택한 ${deleteTargets.length}건 중 ${blockedItems.length}건이 다른 데이터에서 사용 중이므로 삭제할 수 없습니다.`;
  })();

  return (
    <div>
      <PageHeader
        title="자재 마스터"
        description="자재 품목 정보를 관리합니다"
        actions={
          <Link
            href="/materials/items/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            <Plus size={16} />
            자재 등록
          </Link>
        }
      />
      <div className="flex items-center gap-1 mb-4 border-b border-border">
        {(['ALL', ...Object.keys(MATERIAL_CATEGORY_MAP)] as const).map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat as MaterialCategory | 'ALL')}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeCategory === cat
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat === 'ALL' ? '전체' : MATERIAL_CATEGORY_MAP[cat as MaterialCategory]}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="자재명, 자재코드 검색..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-9 w-full pl-8 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={handleDeleteSelected}
            disabled={isChecking}
            className="inline-flex items-center gap-2 px-4 py-2 border border-destructive text-destructive rounded-md text-sm font-medium hover:bg-destructive/10 disabled:opacity-50"
          >
            {isChecking ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            선택 삭제 ({selectedIds.size})
          </button>
        )}
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-input"
                />
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">자재코드</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">자재명</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">분류</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">규격/상세</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">단위</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">단가</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">재고</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">안전재고</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">리드타임</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    데이터를 불러오는 중...
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                  자재 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 ${
                    selectedIds.has(item.id) ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => router.push(`/materials/items/${item.id}`)}
                >
                  <td className="w-10 px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded border-input"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs">{item.material_code}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-muted-foreground shrink-0" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {MATERIAL_CATEGORY_MAP[item.category] || item.category}
                  </td>
                  <td className="px-4 py-3">{renderSpecification(item)}</td>
                  <td className="px-4 py-3">
                    {item.category === 'STEEL' ? 'KG / EA' : item.unit}
                  </td>
                  <td className="px-4 py-3">{renderUnitPrice(item)}</td>
                  <td className="px-4 py-3">{renderStock(item)}</td>
                  <td className="px-4 py-3">
                    {item.safety_stock != null ? item.safety_stock.toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {item.lead_time != null ? `${item.lead_time}일` : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePagination
        totalCount={total}
        currentPage={page}
        pageSize={pageSize}
        onPageChange={(p) => { setPage(p); setSelectedIds(new Set()); }}
      />

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="자재 삭제"
        description={confirmDescription}
        confirmLabel="삭제"
        confirmVariant="destructive"
        confirmDisabled={isDeleting}
        onConfirm={confirmDelete}
      />

      <AlertDialog open={isDependencyModalOpen} onOpenChange={setIsDependencyModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-destructive" />
              자재 삭제 불가
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockedDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 text-sm max-h-60 overflow-y-auto">
            {blockedItems.map(({ material, dependencies }) => (
              <div key={material.id} className="p-2 bg-muted/50 rounded space-y-1">
                <p className="font-medium">{material.name} <span className="text-xs text-muted-foreground font-normal">{material.material_code}</span></p>
                <div className="flex flex-wrap gap-2">
                  {dependencies.items.map((dep) => (
                    <span key={dep.type} className="text-xs text-muted-foreground">
                      {dep.label} {dep.count}건
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-1">
              관련 데이터를 먼저 삭제한 후 자재를 삭제해 주세요.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>닫기</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
