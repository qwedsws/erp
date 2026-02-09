'use client';

import React, { useState, useMemo } from 'react';
import { useJournalEntries } from '@/hooks/accounting/useJournalEntries';
import { useGLAccounts } from '@/hooks/accounting/useGLAccounts';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import {
  ACCOUNTING_SOURCE_TYPE_MAP,
  JOURNAL_ENTRY_STATUS_MAP,
  type AccountingSourceType,
} from '@/types';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('ko-KR').format(n);

const SOURCE_TYPES: (AccountingSourceType | 'ALL')[] = ['ALL', 'ORDER', 'PAYMENT', 'PURCHASE_ORDER', 'STOCK_MOVEMENT'];

export default function JournalsPage() {
  const { journalEntries } = useJournalEntries();
  const { glAccounts } = useGLAccounts();
  const [sourceFilter, setSourceFilter] = useState<AccountingSourceType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const accountById = useMemo(() => new Map(glAccounts.map(a => [a.id, a])), [glAccounts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return journalEntries
      .filter(je => sourceFilter === 'ALL' || je.source_type === sourceFilter)
      .filter(je =>
        !q ||
        je.journal_no.toLowerCase().includes(q) ||
        je.source_no.toLowerCase().includes(q) ||
        je.description.toLowerCase().includes(q)
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [journalEntries, sourceFilter, search]);

  return (
    <div>
      <PageHeader title="분개 장부" description="회계 전표 및 분개 내역을 조회합니다" />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">원천유형:</span>
          {SOURCE_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setSourceFilter(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                sourceFilter === t
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'ALL' ? '전체' : ACCOUNTING_SOURCE_TYPE_MAP[t]}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="전표번호, 원천번호, 설명 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm border border-border rounded-md bg-background w-64"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-2 py-3 w-8"></th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">전표번호</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">전기일</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">원천유형</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">원천번호</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">설명</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">차변합계</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">대변합계</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(je => {
              const isExpanded = expandedId === je.id;
              const drTotal = je.lines.reduce((s, l) => s + l.dr_amount, 0);
              const crTotal = je.lines.reduce((s, l) => s + l.cr_amount, 0);
              return (
                <React.Fragment key={je.id}>
                  <tr
                    className="border-b border-border cursor-pointer hover:bg-muted/30"
                    onClick={() => setExpandedId(isExpanded ? null : je.id)}
                  >
                    <td className="px-2 py-3 text-center text-muted-foreground">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{je.journal_no}</td>
                    <td className="px-4 py-3">{je.posting_date}</td>
                    <td className="px-4 py-3">{ACCOUNTING_SOURCE_TYPE_MAP[je.source_type]}</td>
                    <td className="px-4 py-3 font-mono text-xs">{je.source_no}</td>
                    <td className="px-4 py-3 truncate max-w-[200px]">{je.description}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(drTotal)}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(crTotal)}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={je.status} statusMap={JOURNAL_ENTRY_STATUS_MAP} />
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-muted/20">
                      <td colSpan={9} className="px-8 py-3">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-muted-foreground">
                              <th className="py-1 text-left font-medium">No</th>
                              <th className="py-1 text-left font-medium">계정과목</th>
                              <th className="py-1 text-right font-medium">차변(DR)</th>
                              <th className="py-1 text-right font-medium">대변(CR)</th>
                              <th className="py-1 text-left font-medium">메모</th>
                            </tr>
                          </thead>
                          <tbody>
                            {je.lines.map(line => (
                              <tr key={line.id} className="border-t border-border/50">
                                <td className="py-1">{line.line_no}</td>
                                <td className="py-1">{accountById.get(line.account_id)?.name || line.account_id} ({accountById.get(line.account_id)?.code || '-'})</td>
                                <td className="py-1 text-right font-mono">{line.dr_amount > 0 ? fmt(line.dr_amount) : '-'}</td>
                                <td className="py-1 text-right font-mono">{line.cr_amount > 0 ? fmt(line.cr_amount) : '-'}</td>
                                <td className="py-1 text-muted-foreground">{line.memo || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  전표 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">총 {filtered.length}건</div>
    </div>
  );
}
