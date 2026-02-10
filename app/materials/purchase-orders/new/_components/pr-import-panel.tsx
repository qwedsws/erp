'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, FileInput, Search, Check } from 'lucide-react';
import type { PurchaseRequest, Material, Profile } from '@/types';

interface PRImportPanelProps {
  availablePRs: PurchaseRequest[];
  prsLoading: boolean;
  selectedPrIds: Set<string>;
  importedPrIds: string[];
  importNotice: string | null;
  setImportNotice: (v: string | null) => void;
  togglePrSelection: (prId: string) => void;
  toggleAllPrs: (prIds: string[]) => void;
  importPRs: () => void;
  materialById: Map<string, Material>;
  profileById: Map<string, Profile>;
}

export function PRImportPanel({
  availablePRs,
  prsLoading,
  selectedPrIds,
  importedPrIds,
  importNotice,
  setImportNotice,
  togglePrSelection,
  toggleAllPrs,
  importPRs,
  materialById,
  profileById,
}: PRImportPanelProps) {
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
                ? '모든 진행중 구매요청을 불러왔습니다.'
                : '진행중 구매요청이 없습니다.'}
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
  );
}
