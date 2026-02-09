'use client';

import type { ChangeEvent } from 'react';
import { useMemo, useState } from 'react';
import { useMaterials } from '@/hooks/materials/useMaterials';
import { useStocks } from '@/hooks/materials/useStocks';
import { useSuppliers } from '@/hooks/procurement/useSuppliers';
import { useProjects } from '@/hooks/projects/useProjects';
import { useSteelTags } from '@/hooks/procurement/useSteelTags';
import type { MaterialCategory, Project, Supplier } from '@/domain/shared/entities';

export interface MaterialEditForm {
  name: string;
  category: MaterialCategory | '';
  specification: string;
  unit: string;
  unit_price: string;
  safety_stock: string;
  lead_time: string;
  supplier_id: string;
  notes: string;
}

export interface TagStats {
  total: number;
  available: number;
  allocated: number;
  inUse: number;
  used: number;
  scrap: number;
}

export interface SupplierPriceRow {
  supplier_id: string;
  supplierName: string;
  currentPrice: number;
  prevPrice?: number;
  effectiveDate: string;
  priceCount: number;
  isMain: boolean;
}

export interface PriceStats {
  min: number;
  max: number;
  avg: number;
  supplierCount: number;
}

export type MaterialDetailActionErrorType = 'validation' | 'operation';

export interface MaterialDetailActionResult {
  ok: boolean;
  errorMessage?: string;
  errorType?: MaterialDetailActionErrorType;
}

const createEmptyEditForm = (): MaterialEditForm => ({
  name: '',
  category: '',
  specification: '',
  unit: '',
  unit_price: '',
  safety_stock: '',
  lead_time: '',
  supplier_id: '',
  notes: '',
});

function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function useMaterialDetailViewModel(materialId?: string) {
  const { materials, materialPrices, updateMaterial, deleteMaterial } = useMaterials();
  const { stocks, stockMovements } = useStocks();
  const { suppliers } = useSuppliers();
  const { projects } = useProjects();
  const { steelTags } = useSteelTags();

  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<MaterialEditForm>(createEmptyEditForm);

  const material = useMemo(
    () => materials.find((item) => item.id === materialId),
    [materials, materialId],
  );

  const stock = useMemo(
    () => stocks.find((item) => item.material_id === materialId),
    [stocks, materialId],
  );

  const supplierById = useMemo(() => {
    const map = new Map<string, Supplier>();
    for (const supplier of suppliers) {
      map.set(supplier.id, supplier);
    }
    return map;
  }, [suppliers]);

  const projectById = useMemo(() => {
    const map = new Map<string, Project>();
    for (const project of projects) {
      map.set(project.id, project);
    }
    return map;
  }, [projects]);

  const mainSupplier = useMemo(() => {
    if (!material?.supplier_id) return null;
    return supplierById.get(material.supplier_id) ?? null;
  }, [material, supplierById]);

  const materialTags = useMemo(() => {
    if (!material || material.category !== 'STEEL') return [];
    return steelTags.filter((tag) => tag.material_id === material.id);
  }, [material, steelTags]);

  const tagStats = useMemo<TagStats>(() => {
    return {
      total: materialTags.length,
      available: materialTags.filter((tag) => tag.status === 'AVAILABLE').length,
      allocated: materialTags.filter((tag) => tag.status === 'ALLOCATED').length,
      inUse: materialTags.filter((tag) => tag.status === 'IN_USE').length,
      used: materialTags.filter((tag) => tag.status === 'USED').length,
      scrap: materialTags.filter((tag) => tag.status === 'SCRAP').length,
    };
  }, [materialTags]);

  const movements = useMemo(() => {
    if (!materialId) return [];
    return stockMovements
      .filter((movement) => movement.material_id === materialId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [materialId, stockMovements]);

  const prices = useMemo(() => {
    if (!materialId) return [];
    return materialPrices
      .filter((price) => price.material_id === materialId)
      .sort((a, b) => b.effective_date.localeCompare(a.effective_date));
  }, [materialId, materialPrices]);

  const supplierPrices = useMemo<SupplierPriceRow[]>(() => {
    const latestBySupplier = new Map<string, SupplierPriceRow>();
    const priceCountBySupplier = new Map<string, number>();

    for (const price of prices) {
      priceCountBySupplier.set(
        price.supplier_id,
        (priceCountBySupplier.get(price.supplier_id) ?? 0) + 1,
      );
    }

    for (const price of prices) {
      if (latestBySupplier.has(price.supplier_id)) continue;
      latestBySupplier.set(price.supplier_id, {
        supplier_id: price.supplier_id,
        supplierName: supplierById.get(price.supplier_id)?.name ?? '알 수 없음',
        currentPrice: price.unit_price,
        prevPrice: price.prev_price,
        effectiveDate: price.effective_date,
        priceCount: priceCountBySupplier.get(price.supplier_id) ?? 0,
        isMain: price.supplier_id === material?.supplier_id,
      });
    }

    return Array.from(latestBySupplier.values()).sort(
      (left, right) => left.currentPrice - right.currentPrice,
    );
  }, [material?.supplier_id, prices, supplierById]);

  const priceHistory = useMemo(() => {
    if (!selectedSupplier) return prices;
    return prices.filter((price) => price.supplier_id === selectedSupplier);
  }, [prices, selectedSupplier]);

  const priceStats = useMemo<PriceStats>(() => {
    if (supplierPrices.length === 0) {
      return { min: 0, max: 0, avg: 0, supplierCount: 0 };
    }

    const currentPrices = supplierPrices.map((row) => row.currentPrice);
    return {
      min: Math.min(...currentPrices),
      max: Math.max(...currentPrices),
      avg: Math.round(
        currentPrices.reduce((sum, value) => sum + value, 0) / currentPrices.length,
      ),
      supplierCount: supplierPrices.length,
    };
  }, [supplierPrices]);

  const handleStartEdit = () => {
    if (!material) return;
    setEditForm({
      name: material.name,
      category: material.category || '',
      specification: material.specification || '',
      unit: material.unit || '',
      unit_price: material.unit_price != null ? String(material.unit_price) : '',
      safety_stock: material.safety_stock != null ? String(material.safety_stock) : '',
      lead_time: material.lead_time != null ? String(material.lead_time) : '',
      supplier_id: material.supplier_id || '',
      notes: material.notes || '',
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleEditChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async (): Promise<MaterialDetailActionResult> => {
    if (!material) {
      return {
        ok: false,
        errorMessage: '자재를 찾을 수 없습니다.',
        errorType: 'operation',
      };
    }
    if (!editForm.name.trim()) {
      return {
        ok: false,
        errorMessage: '자재명을 입력하세요.',
        errorType: 'validation',
      };
    }
    if (!editForm.category) {
      return {
        ok: false,
        errorMessage: '분류를 선택하세요.',
        errorType: 'validation',
      };
    }
    if (!editForm.unit.trim()) {
      return {
        ok: false,
        errorMessage: '단위를 선택하세요.',
        errorType: 'validation',
      };
    }

    try {
      await updateMaterial(material.id, {
        name: editForm.name,
        category: editForm.category as MaterialCategory,
        specification: editForm.specification || undefined,
        unit: editForm.unit,
        unit_price: parseOptionalNumber(editForm.unit_price),
        safety_stock: parseOptionalNumber(editForm.safety_stock),
        lead_time: parseOptionalNumber(editForm.lead_time),
        supplier_id: editForm.supplier_id || undefined,
        notes: editForm.notes || undefined,
      });
      setIsEditing(false);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        errorMessage:
          error instanceof Error ? error.message : '자재 저장 중 오류가 발생했습니다.',
        errorType: 'operation',
      };
    }
  };

  const handleDelete = async (): Promise<MaterialDetailActionResult> => {
    if (!material) {
      return {
        ok: false,
        errorMessage: '자재를 찾을 수 없습니다.',
        errorType: 'operation',
      };
    }
    try {
      await deleteMaterial(material.id);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        errorMessage:
          error instanceof Error ? error.message : '자재 삭제 중 오류가 발생했습니다.',
        errorType: 'operation',
      };
    }
  };

  const getPriceChangePercent = (current: number, prev?: number): number | null => {
    if (!prev) return null;
    return ((current - prev) / prev) * 100;
  };

  return {
    material,
    stock,
    suppliers,
    supplierById,
    projectById,
    mainSupplier,
    materialTags,
    tagStats,
    movements,
    supplierPrices,
    priceHistory,
    priceStats,
    selectedSupplier,
    isEditing,
    editForm,
    setSelectedSupplier,
    handleStartEdit,
    handleCancelEdit,
    handleEditChange,
    handleSaveEdit,
    handleDelete,
    getPriceChangePercent,
  };
}
