'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useMaterials } from '@/hooks/materials/useMaterials';
import { MATERIAL_CATEGORY_MAP } from '@/types';
import { PageHeader } from '@/components/common/page-header';
import { useFeedbackToast } from '@/components/common/feedback-toast-provider';
import { ArrowLeft, ClipboardCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useStocks } from '@/hooks/materials/useStocks';

export default function StocktakePage() {
  const { materials } = useMaterials();
  const { stocks, bulkAdjustStock } = useStocks();
  const { showError, showSuccess } = useFeedbackToast();

  const [actualQuantities, setActualQuantities] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  const materialById = useMemo(
    () => new Map(materials.map((material) => [material.id, material])),
    [materials],
  );

  const stockMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const stock of stocks) {
      map[stock.material_id] = stock.quantity;
    }
    return map;
  }, [stocks]);

  const differences = useMemo(() => {
    const diffs: Record<string, number> = {};
    for (const material of materials) {
      const actualStr = actualQuantities[material.id];
      if (actualStr !== undefined && actualStr !== '') {
        const actual = Number(actualStr);
        const system = stockMap[material.id] ?? 0;
        if (!isNaN(actual)) {
          diffs[material.id] = actual - system;
        }
      }
    }
    return diffs;
  }, [materials, actualQuantities, stockMap]);

  const rowsWithDifferences = useMemo(() => {
    return Object.entries(differences).filter(([, diff]) => diff !== 0);
  }, [differences]);

  const totalItems = materials.length;

  const diffCount = rowsWithDifferences.length;

  const totalDiffAmount = useMemo(() => {
    let total = 0;
    for (const [materialId, diff] of rowsWithDifferences) {
      const material = materialById.get(materialId);
      if (material) {
        total += Math.abs(diff) * (material.unit_price ?? 0);
      }
    }
    return total;
  }, [rowsWithDifferences, materialById]);

  const handleQuantityChange = (materialId: string, value: string) => {
    setActualQuantities((prev) => ({ ...prev, [materialId]: value }));
    setSuccessMessage('');
  };

  const handleBulkAdjust = async () => {
    const adjustments = rowsWithDifferences.map(([materialId]) => ({
      material_id: materialId,
      actual_qty: Number(actualQuantities[materialId]),
    }));

    const result = await bulkAdjustStock(adjustments);
    if (result.ok) {
      setSuccessMessage(`${adjustments.length}개 품목의 재고가 성공적으로 조정되었습니다.`);
      showSuccess('재고 실사 반영이 완료되었습니다.');
      setActualQuantities({});
    } else {
      showError(result.error);
    }
  };

  const getDiffColor = (diff: number) => {
    if (diff < 0) return 'text-red-600';
    if (diff > 0) return 'text-green-600';
    return 'text-muted-foreground';
  };

  const getDiffText = (diff: number) => {
    if (diff > 0) return `+${diff}`;
    return `${diff}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/materials/inventory"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </Link>
      </div>

      <PageHeader
        title="재고 실사"
        description="실제 재고 수량을 확인하고 시스템 재고를 조정합니다"
      />

      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <ClipboardCheck className="h-4 w-4" />
            총 품목수
          </div>
          <div className="text-2xl font-bold">{totalItems}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <AlertTriangle className="h-4 w-4" />
            차이 발생 품목
          </div>
          <div className="text-2xl font-bold">{diffCount}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <AlertTriangle className="h-4 w-4" />
            총 차이 금액
          </div>
          <div className="text-2xl font-bold">
            {totalDiffAmount.toLocaleString()}원
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold">실사 목록</h3>
          <button
            onClick={handleBulkAdjust}
            disabled={rowsWithDifferences.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="h-4 w-4" />
            일괄 조정
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  자재코드
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  자재명
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  분류
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  단위
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  시스템 재고
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  실사 수량
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  차이
                </th>
              </tr>
            </thead>
            <tbody>
              {materials.map((material) => {
                const systemQty = stockMap[material.id] ?? 0;
                const actualStr = actualQuantities[material.id];
                const hasActual = actualStr !== undefined && actualStr !== '';
                const diff = hasActual ? Number(actualStr) - systemQty : null;

                return (
                  <tr
                    key={material.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {material.material_code}
                    </td>
                    <td className="px-4 py-3 font-medium">{material.name}</td>
                    <td className="px-4 py-3">
                      {MATERIAL_CATEGORY_MAP[material.category as keyof typeof MATERIAL_CATEGORY_MAP] ??
                        material.category}
                    </td>
                    <td className="px-4 py-3">{material.unit}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {systemQty.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        value={actualQuantities[material.id] ?? ''}
                        onChange={(e) =>
                          handleQuantityChange(material.id, e.target.value)
                        }
                        placeholder={String(systemQty)}
                        className="w-24 rounded-md border border-border bg-background px-2 py-1 text-right text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {diff !== null && !isNaN(diff) ? (
                        <span className={`font-medium ${getDiffColor(diff)}`}>
                          {getDiffText(diff)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {materials.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    등록된 자재가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
