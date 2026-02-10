'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { SearchSelect } from '@/components/common/search-select';
import { usePurchaseRequestForm } from '@/hooks/procurement/usePurchaseRequestForm';

const cellInput =
  'w-full h-8 px-2 rounded border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring';
const headerInput =
  'w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring';

export default function NewPurchaseRequestPage() {
  const {
    header, setHeader,
    items, materials, profiles,
    materialById,
    validItemCount,
    addItem, removeItem, updateItem,
    calcSteelItem, handleSubmit, isLoading,
  } = usePurchaseRequestForm();

  const requesterOptions = useMemo(
    () => profiles.map((p) => ({
      value: p.id,
      label: `${p.name} (${p.department ?? p.role})`,
    })),
    [profiles],
  );

  const materialCodeOptions = useMemo(
    () => materials.map((m) => ({
      value: m.id,
      label: m.material_code,
      searchText: `${m.material_code} ${m.name} ${m.steel_grade || ''}`,
    })),
    [materials],
  );

  const handleHeaderChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setHeader((prev) => ({ ...prev, [name]: value }));
  };

  // 마지막 행에 자재를 선택하면 자동으로 빈 행 추가
  const handleMaterialChange = (index: number, val: string) => {
    updateItem(index, 'material_id', val);
    if (val && index === items.length - 1) {
      addItem();
    }
  };

  const handleRowKeyDown = (e: React.KeyboardEvent, rowIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (rowIndex === items.length - 1) {
        addItem();
      }
      setTimeout(() => {
        const nextInput = document.querySelector<HTMLInputElement>(`[data-row="${rowIndex + 1}"] td:nth-child(2) input`);
        nextInput?.focus();
      }, 0);
    }
  };

  return (
    <div>
      {/* Back navigation */}
      <div className="flex items-center gap-2 mb-4">
        <Link href="/materials/purchase-requests" className="p-1 rounded hover:bg-accent">
          <ArrowLeft size={18} />
        </Link>
        <span className="text-sm text-muted-foreground">구매 요청</span>
      </div>

      <PageHeader
        title="구매 요청 등록 (일괄)"
        description="여러 자재의 구매 요청을 한 번에 등록합니다"
      />

      <form onSubmit={(e) => void handleSubmit(e)}>
        {/* Common header fields */}
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <h3 className="font-semibold mb-4">공통 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                요청자 <span className="text-destructive">*</span>
              </label>
              <SearchSelect
                options={requesterOptions}
                value={header.requested_by}
                onChange={(val) => setHeader((prev) => ({ ...prev, requested_by: val }))}
                placeholder="요청자 검색..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                필요일 <span className="text-destructive">*</span>
              </label>
              <input
                name="required_date"
                type="date"
                value={header.required_date}
                onChange={handleHeaderChange}
                required
                className={headerInput}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">비고</label>
              <input
                name="notes"
                type="text"
                value={header.notes}
                onChange={handleHeaderChange}
                placeholder="추가 참고 사항 (선택)"
                className={headerInput}
              />
            </div>
          </div>
        </div>

        {/* Line items table */}
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">요청 품목</h3>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-input hover:bg-accent transition-colors"
            >
              <Plus size={14} />
              행 추가
            </button>
          </div>

          <div className="overflow-x-auto min-h-[320px]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-2 py-2 text-center font-medium text-muted-foreground w-10">#</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground min-w-[140px]">품목코드</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground min-w-[180px]">품목명</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground min-w-[200px]">규격(mm)</th>
                  <th className="px-2 py-2 text-right font-medium text-muted-foreground w-20">수량</th>
                  <th className="px-2 py-2 text-right font-medium text-muted-foreground w-24">단위중량</th>
                  <th className="px-2 py-2 text-right font-medium text-muted-foreground w-24">총중량</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground min-w-[160px]">사유</th>
                  <th className="px-2 py-2 text-center font-medium text-muted-foreground w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const calc = calcSteelItem(item);
                  const mat = item.material_id ? materialById.get(item.material_id) : null;

                  return (
                    <tr
                      key={index}
                      data-row={index}
                      className="border-b border-border last:border-0 align-top"
                    >
                      {/* # */}
                      <td className="px-2 py-2 text-center text-muted-foreground">{index + 1}</td>

                      {/* 품목코드 */}
                      <td className="px-2 py-2">
                        <SearchSelect
                          options={materialCodeOptions}
                          value={item.material_id}
                          onChange={(val) => handleMaterialChange(index, val)}
                          placeholder="코드 검색"
                          compact
                        />
                      </td>

                      {/* 품목명 (자유 입력 — 프로젝트/부품 태깅) */}
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={item.custom_name}
                          onChange={(e) => updateItem(index, 'custom_name', e.target.value)}
                          placeholder={mat?.name || '품목명 입력'}
                          className={cellInput}
                        />
                      </td>

                      {/* 규격 */}
                      <td className="px-2 py-2">
                        {calc.isSteel ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={item.dimension_w}
                              onChange={(e) => updateItem(index, 'dimension_w', e.target.value)}
                              placeholder="W"
                              min="0"
                              className={`${cellInput} text-right w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                            />
                            <span className="text-muted-foreground">×</span>
                            <input
                              type="number"
                              value={item.dimension_l}
                              onChange={(e) => updateItem(index, 'dimension_l', e.target.value)}
                              placeholder="L"
                              min="0"
                              className={`${cellInput} text-right w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                            />
                            <span className="text-muted-foreground">×</span>
                            <input
                              type="number"
                              value={item.dimension_h}
                              onChange={(e) => updateItem(index, 'dimension_h', e.target.value)}
                              placeholder="H"
                              min="0"
                              className={`${cellInput} text-right w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                            />
                          </div>
                        ) : mat?.specification ? (
                          <span className="text-[11px] leading-8 block">{mat.specification}</span>
                        ) : (
                          <span className="text-muted-foreground leading-8 block">-</span>
                        )}
                      </td>

                      {/* 수량 */}
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          placeholder="0"
                          min="1"
                          className={`${cellInput} text-right`}
                        />
                      </td>

                      {/* 단위중량 */}
                      <td className="px-2 py-2 text-right">
                        {calc.isSteel && calc.pieceWeight > 0 ? (
                          <span className="leading-8 block">{calc.pieceWeight.toFixed(3)} kg</span>
                        ) : (
                          <span className="text-muted-foreground leading-8 block">-</span>
                        )}
                      </td>

                      {/* 총중량 */}
                      <td className="px-2 py-2 text-right">
                        {calc.isSteel && calc.totalWeight > 0 ? (
                          <span className="leading-8 block font-medium">{calc.totalWeight.toFixed(2)} kg</span>
                        ) : (
                          <span className="text-muted-foreground leading-8 block">-</span>
                        )}
                      </td>

                      {/* 사유 */}
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={item.reason}
                          onChange={(e) => updateItem(index, 'reason', e.target.value)}
                          onKeyDown={(e) => handleRowKeyDown(e, index)}
                          placeholder="요청 사유"
                          className={cellInput}
                        />
                      </td>

                      {/* 삭제 */}
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={items.length <= 1}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="행 삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isLoading || validItemCount === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            {isLoading ? '등록 중...' : `요청 등록 (${validItemCount}건)`}
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
