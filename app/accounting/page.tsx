'use client';

import React from 'react';
import Link from 'next/link';
import { useAccountingDashboardData } from '@/hooks/accounting/useAccountingDashboardData';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import { ACCOUNTING_SOURCE_TYPE_MAP, JOURNAL_ENTRY_STATUS_MAP } from '@/types';
import { Wallet, CreditCard, BookOpen, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const fmt = (n: number) => new Intl.NumberFormat('ko-KR').format(n);

export default function AccountingDashboardPage() {
  const { totalReceivables, totalPayables, totalJournalCount, collectionRate, monthlyDebits, recentJournals } = useAccountingDashboardData();

  return (
    <div>
      <PageHeader
        title="회계 대시보드"
        description="매출채권·매입채무 현황과 분개 장부를 관리합니다"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
          <div className="p-2 rounded-md bg-blue-100 text-blue-700"><Wallet size={20} /></div>
          <div>
            <p className="text-xs text-muted-foreground">총 매출채권</p>
            <p className="text-xl font-bold">{fmt(totalReceivables)}원</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
          <div className="p-2 rounded-md bg-red-100 text-red-700"><CreditCard size={20} /></div>
          <div>
            <p className="text-xs text-muted-foreground">총 매입채무</p>
            <p className="text-xl font-bold">{fmt(totalPayables)}원</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
          <div className="p-2 rounded-md bg-green-100 text-green-700"><BookOpen size={20} /></div>
          <div>
            <p className="text-xs text-muted-foreground">전표 수</p>
            <p className="text-xl font-bold">{totalJournalCount}건</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
          <div className="p-2 rounded-md bg-purple-100 text-purple-700"><TrendingUp size={20} /></div>
          <div>
            <p className="text-xs text-muted-foreground">수금률</p>
            <p className="text-xl font-bold">{collectionRate}%</p>
          </div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="rounded-lg border border-border bg-card p-4 mb-6">
        <h3 className="text-sm font-medium mb-4">월별 차변 합계</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyDebits}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(value) => [`${fmt(value as number)}원`, '차변합계']} />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Journals */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-medium">최근 전표</h3>
          <Link href="/accounting/journals" className="text-xs text-primary hover:underline">전체 보기</Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">전표번호</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">전기일</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">원천유형</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">원천번호</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">설명</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">차변</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">대변</th>
              <th className="px-4 py-2 text-center font-medium text-muted-foreground">상태</th>
            </tr>
          </thead>
          <tbody>
            {recentJournals.map(je => {
              const drTotal = je.lines.reduce((s, l) => s + l.dr_amount, 0);
              const crTotal = je.lines.reduce((s, l) => s + l.cr_amount, 0);
              return (
                <tr key={je.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2 font-mono text-xs">{je.journal_no}</td>
                  <td className="px-4 py-2">{je.posting_date}</td>
                  <td className="px-4 py-2">{ACCOUNTING_SOURCE_TYPE_MAP[je.source_type]}</td>
                  <td className="px-4 py-2 font-mono text-xs">{je.source_no}</td>
                  <td className="px-4 py-2 truncate max-w-[200px]">{je.description}</td>
                  <td className="px-4 py-2 text-right font-mono">{fmt(drTotal)}</td>
                  <td className="px-4 py-2 text-right font-mono">{fmt(crTotal)}</td>
                  <td className="px-4 py-2 text-center"><StatusBadge status={je.status} statusMap={JOURNAL_ENTRY_STATUS_MAP} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
