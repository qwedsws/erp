'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/common/page-header';
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight, FileInput, Search, Check } from 'lucide-react';
import { usePurchaseOrderForm } from '@/hooks/procurement/usePurchaseOrderForm';

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const {
    form,
    setForm,
    items,
    materials,
    suppliers,
    materialById,
    profileById,
    totalAmount,
    addItem,
    removeItem,
    updateItem,
    handleSubmit,
    calcSteelItem,
    // PR import
    availablePRs,
    prsLoading,
    selectedPrIds,
    importedPrIds,
    importNotice,
    setImportNotice,
    togglePrSelection,
    toggleAllPrs,
    importPRs,
  } = usePurchaseOrderForm();

  // PR import panel state
  const [prPanelOpen, setPrPanelOpen] = useState(false);
  const [prSearch, setPrSearch] = useState('');

  // Filter available PRs by search query
  const filteredPRs = useMemo(() => {
    if (!prSearch.trim()) return availablePRs;
    const query = prSearch.toLowerCase();
    return availablePRs.filter((pr) => {
      const mat = materialById.get(pr.material_id);
      const matName = mat?.name?.toLowerCase() ?? '';
      const matCode = mat?.material_code?.toLowerCase() ?? '';
      const prNo = pr.pr_no?.toLowerCase() ?? '';
      return prNo.includes(query) || matName.includes(query) || matCode.includes(query);
    });
  }, [availablePRs, prSearch, materialById]);

  const filteredPrIds = useMemo(() => filteredPRs.map((pr) => pr.id), [filteredPRs]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.push('/materials/purchase-orders')} className="p-1 rounded hover:bg-accent">
          <ArrowLeft size={18} />
        </button>
        <span className="text-sm text-muted-foreground">발주 관리</span>
      </div>
      <PageHeader title="발주 등록" description="새로운 구매 발주를 등록합니다" />

      <form onSubmit={handleSubmit} className="max-w-5xl">
        {/* Basic Info */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4 mb-6">
          <h3 className="text-sm font-semibold">기본 정보</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">공급처 *</label>
              <select
                value={form.supplier_id}
                onChange={(e) => setForm(prev => ({ ...prev, supplier_id: e.target.value }))}
                required
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">선택하세요</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">발주일 *</label>
              <input
                type="date"
                value={form.order_date}
                onChange={(e) => setForm(prev => ({ ...prev, order_date: e.target.value }))}
                required
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">납기일</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm(prev => ({ ...prev, due_date: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">비고</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>

        {/* PR Import Panel */}
        <div className="rounded-lg border border-border bg-card mb-6">
          <button
            type="button"
            onClick={() => setPrPanelOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileInput size={16} className="text-blue-600" />
              <span className="text-sm font-semibold">구매요청에서 불러오기</span>
              {availablePRs.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded">
                  {availablePRs.length}건
                </span>
              )}
            </div>
            {prPanelOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {prPanelOpen && (
            <div className="px-6 pb-6 space-y-4 border-t border-border pt-4">
              {/* Import notice */}
              {importNotice && (
                <div className="flex items-center justify-between px-3 py-2 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-sm text-emerald-700 dark:text-emerald-300">{importNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImportNotice(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    닫기
                  </button>
                </div>
              )}

              {prsLoading ? (
                <p className="text-sm text-muted-foreground py-4 text-center">구매요청을 불러오는 중...</p>
              ) : availablePRs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {importedPrIds.length > 0
                    ? '모든 승인된 구매요청을 불러왔습니다.'
                    : '승인된 구매요청이 없습니다.'}
                </p>
              ) : (
                <>
                  {/* Search + Import button row */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-xs">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={prSearch}
                        onChange={(e) => setPrSearch(e.target.value)}
                        placeholder="PR번호, 자재명 검색..."
                        className="w-full h-8 pl-8 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={importPRs}
                      disabled={selectedPrIds.size === 0}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <FileInput size={13} />
                      불러오기 ({selectedPrIds.size})
                    </button>
                  </div>

                  {/* PR table */}
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border">
                          <th className="px-3 py-2.5 text-center w-10">
                            <input
                              type="checkbox"
                              checked={filteredPRs.length > 0 && filteredPrIds.every((id) => selectedPrIds.has(id))}
                              onChange={() => toggleAllPrs(filteredPrIds)}
                              className="h-3.5 w-3.5 rounded border-gray-300"
                            />
                          </th>
                          <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">PR번호</th>
                          <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">자재명</th>
                          <th className="px-3 py-2.5 text-right font-medium text-muted-foreground w-20">수량</th>
                          <th className="px-3 py-2.5 text-left font-medium text-muted-foreground w-28">필요일</th>
                          <th className="px-3 py-2.5 text-left font-medium text-muted-foreground w-24">요청자</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPRs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">
                              검색 결과가 없습니다
                            </td>
                          </tr>
                        ) : (
                          filteredPRs.map((pr) => {
                            const mat = materialById.get(pr.material_id);
                            const requester = profileById.get(pr.requested_by);
                            const isSelected = selectedPrIds.has(pr.id);
                            return (
                              <tr
                                key={pr.id}
                                onClick={() => togglePrSelection(pr.id)}
                                className={`border-b border-border last:border-0 cursor-pointer transition-colors ${
                                  isSelected ? 'bg-blue-50 dark:bg-blue-950/20' : 'hover:bg-muted/30'
                                }`}
                              >
                                <td className="px-3 py-2.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => togglePrSelection(pr.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-3.5 w-3.5 rounded border-gray-300"
                                  />
                                </td>
                                <td className="px-3 py-2.5 font-mono text-xs">{pr.pr_no}</td>
                                <td className="px-3 py-2.5">
                                  {mat ? (
                                    <span>
                                      <span className="text-muted-foreground">[{mat.material_code}]</span>{' '}
                                      {mat.name}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-right">{pr.quantity}</td>
                                <td className="px-3 py-2.5">{pr.required_date}</td>
                                <td className="px-3 py-2.5">{requester?.name ?? pr.requested_by}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">발주 품목</h3>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-muted rounded-md hover:bg-muted/80 transition-colors"
            >
              <Plus size={14} />
              품목 추가
            </button>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">#</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">자재</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground w-24">수량</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground w-32">단가 (원)</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground w-36">소계</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground w-12"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const qty = Number(item.quantity) || 0;
                  const price = Number(item.unit_price) || 0;
                  const selectedMaterial = item.material_id ? materialById.get(item.material_id) : null;
                  const calc = calcSteelItem(item);
                  const subtotal = calc.isSteel ? calc.subtotal : qty * price;

                  return (
                    <tr key={index} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-muted-foreground align-top">{index + 1}</td>
                      <td className="px-4 py-3">
                        <select
                          value={item.material_id}
                          onChange={(e) => updateItem(index, 'material_id', e.target.value)}
                          className="w-full h-8 px-2 rounded border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="">자재 선택</option>
                          {materials.map(m => (
                            <option key={m.id} value={m.id}>
                              [{m.material_code}] {m.name} ({m.unit})
                            </option>
                          ))}
                        </select>
                        {selectedMaterial?.specification && (
                          <p className="text-xs text-muted-foreground mt-0.5">{selectedMaterial.specification}</p>
                        )}
                        {calc.isSteel && (
                          <div className="mt-1.5 p-2 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs space-y-0.5">
                            <p className="text-blue-700 dark:text-blue-300">
                              밀도: {calc.density} g/cm3 | kg당 단가: {calc.pricePerKg.toLocaleString()} 원/kg
                            </p>
                          </div>
                        )}

                        {/* STEEL Dimension Inputs */}
                        {calc.isSteel && (
                          <div className="mt-2 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">치수 (mm)</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <label className="block text-[10px] text-muted-foreground mb-0.5">가로(W)</label>
                                <input
                                  type="number"
                                  value={item.dimension_w}
                                  onChange={(e) => updateItem(index, 'dimension_w', e.target.value)}
                                  placeholder="0"
                                  min="0"
                                  className="w-full h-7 px-2 rounded border border-input bg-background text-xs text-right focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                              </div>
                              <span className="text-muted-foreground mt-3.5">x</span>
                              <div className="flex-1">
                                <label className="block text-[10px] text-muted-foreground mb-0.5">세로(L)</label>
                                <input
                                  type="number"
                                  value={item.dimension_l}
                                  onChange={(e) => updateItem(index, 'dimension_l', e.target.value)}
                                  placeholder="0"
                                  min="0"
                                  className="w-full h-7 px-2 rounded border border-input bg-background text-xs text-right focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                              </div>
                              <span className="text-muted-foreground mt-3.5">x</span>
                              <div className="flex-1">
                                <label className="block text-[10px] text-muted-foreground mb-0.5">높이(H)</label>
                                <input
                                  type="number"
                                  value={item.dimension_h}
                                  onChange={(e) => updateItem(index, 'dimension_h', e.target.value)}
                                  placeholder="0"
                                  min="0"
                                  className="w-full h-7 px-2 rounded border border-input bg-background text-xs text-right focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                              </div>
                            </div>
                            {calc.pieceWeight > 0 && (
                              <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-0.5">
                                <p className="text-emerald-700 dark:text-emerald-300">
                                  건당 중량: {calc.pieceWeight.toFixed(3)} kg
                                </p>
                                {qty > 0 && (
                                  <>
                                    <p className="text-emerald-700 dark:text-emerald-300">
                                      총 중량: {calc.totalWeight.toFixed(2)} kg
                                    </p>
                                    <p className="text-emerald-700 dark:text-emerald-300">
                                      EA당 단가: {calc.unitPrice.toLocaleString()} 원
                                    </p>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {calc.isSteel && (
                          <p className="text-xs text-muted-foreground mb-1">수량 (EA)</p>
                        )}
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          placeholder="0"
                          min="1"
                          className="w-full h-8 px-2 rounded border border-input bg-background text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        {calc.isSteel ? (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">kg당 단가</p>
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                              placeholder="0"
                              min="0"
                              className="w-full h-8 px-2 rounded border border-input bg-background text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                        ) : (
                          <input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                            placeholder="0"
                            min="0"
                            className="w-full h-8 px-2 rounded border border-input bg-background text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium align-top">
                        {subtotal > 0 ? `${subtotal.toLocaleString()}원` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center align-top">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={items.length <= 1}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 border-t border-border">
                  <td colSpan={4} className="px-4 py-3 text-right font-semibold">합계</td>
                  <td className="px-4 py-3 text-right font-bold text-base">
                    {totalAmount > 0 ? `${totalAmount.toLocaleString()}원` : '-'}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">
            저장
          </button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent">
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
