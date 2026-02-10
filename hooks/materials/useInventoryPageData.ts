'use client';

import { useMemo, useState } from 'react';
import { useStocks } from '@/hooks/materials/useStocks';
import { useProjects } from '@/hooks/projects/useProjects';
import { useSteelTags } from '@/hooks/procurement/useSteelTags';
import { useInventoryListQuery } from '@/hooks/materials/useInventoryListQuery';
import { useFeedbackToast } from '@/components/common/feedback-toast-provider';

export function useInventoryPageData() {
  const {
    items: materials,
    total: pageTotal,
    page,
    pageSize,
    isLoading,
    stats,
    setPage,
    setSearch,
    setLowStockOnly,
    refresh,
  } = useInventoryListQuery();
  const { stocks } = useStocks();
  const { projects } = useProjects();
  const {
    steelTags,
    allocateSteelTag,
    issueSteelTag,
    completeSteelTag,
    scrapSteelTag,
    getAvailableActions,
  } = useSteelTags();
  const { showError } = useFeedbackToast();

  const [activeTab, setActiveTab] = useState<'all' | 'steel_tags'>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [allocatingTagId, setAllocatingTagId] = useState<string | null>(null);
  const [allocateProjectId, setAllocateProjectId] = useState<string>('');

  const materialById = useMemo(
    () => new Map(materials.map((material) => [material.id, material])),
    [materials],
  );
  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );
  const stockByMaterialId = useMemo(
    () => new Map(stocks.map((stock) => [stock.material_id, stock])),
    [stocks],
  );

  const steelTagData = useMemo(() => {
    return steelTags.map((steelTag) => {
      const material = materialById.get(steelTag.material_id);
      const project = steelTag.project_id ? projectById.get(steelTag.project_id) : null;
      return { ...steelTag, material, project };
    });
  }, [steelTags, materialById, projectById]);

  const steelTagStats = useMemo(() => {
    const available = steelTags.filter((steelTag) => steelTag.status === 'AVAILABLE');
    const availableWeight = available.reduce((sum, steelTag) => sum + steelTag.weight, 0);
    return {
      total: steelTags.length,
      available: available.length,
      availableWeight,
      allocated: steelTags.filter((steelTag) => steelTag.status === 'ALLOCATED').length,
      inUse: steelTags.filter((steelTag) => steelTag.status === 'IN_USE').length,
      used: steelTags.filter((steelTag) => steelTag.status === 'USED').length,
    };
  }, [steelTags]);

  // Join paginated materials with hydrated stocks for display
  const inventoryRows = useMemo(() => {
    return materials.map((material) => {
      const stock = stockByMaterialId.get(material.id);
      const quantity = stock?.quantity ?? 0;
      const safetyStock = material.safety_stock ?? 0;
      return {
        id: material.id,
        material_code: material.material_code,
        name: material.name,
        category: material.category,
        specification: material.specification || '-',
        unit: material.unit,
        quantity,
        safety_stock: safetyStock,
        location_code: stock?.location_code || '-',
        unit_price: stock?.avg_unit_price ?? material.unit_price ?? 0,
        isLowStock: quantity < safetyStock,
      };
    });
  }, [materials, stockByMaterialId]);

  // KPI stats from server aggregate
  const totalItems = stats.totalItems;
  const lowStockCount = stats.lowStockCount;
  const totalValue = stats.totalValue;

  const handleShowLowStockOnly = (val: boolean) => {
    setShowLowStockOnly(val);
    setLowStockOnly(val);
  };

  const startAllocate = (tagId: string) => {
    setAllocatingTagId(tagId);
  };

  const cancelAllocate = () => {
    setAllocatingTagId(null);
    setAllocateProjectId('');
  };

  const confirmAllocate = async (tagId: string) => {
    if (!allocateProjectId) return;
    try {
      await allocateSteelTag(tagId, allocateProjectId);
      cancelAllocate();
    } catch (err) {
      showError(err instanceof Error ? err.message : '강재 태그 할당 중 오류가 발생했습니다.');
    }
  };

  const handleIssueTag = async (tagId: string) => {
    try {
      await issueSteelTag(tagId);
    } catch (err) {
      showError(err instanceof Error ? err.message : '강재 태그 출고 처리 중 오류가 발생했습니다.');
    }
  };

  const handleCompleteTag = async (tagId: string) => {
    try {
      await completeSteelTag(tagId);
    } catch (err) {
      showError(err instanceof Error ? err.message : '강재 태그 완료 처리 중 오류가 발생했습니다.');
    }
  };

  const handleScrapTag = async (tagId: string) => {
    try {
      await scrapSteelTag(tagId);
    } catch (err) {
      showError(err instanceof Error ? err.message : '강재 태그 폐기 처리 중 오류가 발생했습니다.');
    }
  };

  return {
    activeTab,
    setActiveTab,
    allocatingTagId,
    allocateProjectId,
    setAllocateProjectId,
    projects,
    steelTagData,
    steelTagStats,
    inventoryRows,
    showLowStockOnly,
    setShowLowStockOnly: handleShowLowStockOnly,
    totalItems,
    lowStockCount,
    totalValue,
    // Pagination
    page,
    pageSize,
    pageTotal,
    isLoading,
    setPage,
    setSearch,
    refresh,
    // Tag actions
    getAvailableActions,
    startAllocate,
    cancelAllocate,
    confirmAllocate,
    handleIssueTag,
    handleCompleteTag,
    handleScrapTag,
  };
}
