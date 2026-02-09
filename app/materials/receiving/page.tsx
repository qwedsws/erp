'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/common/page-header';
import { useReceivingPageData } from '@/hooks/materials/useReceivingPageData';
import { Plus, Package, PackagePlus } from 'lucide-react';
import { PendingPOPanel } from './_components/pending-po-panel';
import { ReceivingHistoryPanel } from './_components/receiving-history-panel';
import { ReceivingKpiCards } from './_components/receiving-kpi-cards';

export default function ReceivingPage() {
  const {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    expandedPOs,
    materialById,
    purchaseOrderById,
    supplierById,
    baseTimeMs,
    today,
    incomingMovements,
    filteredMovements,
    filteredPendingPOs,
    monthlyCount,
    monthlyAmount,
    pendingPOCount,
    pendingAmount,
    overduePOCount,
    togglePO,
    expandAll,
    collapseAll,
  } = useReceivingPageData();

  return (
    <div>
      <PageHeader
        title="입고 관리"
        description="발주별 미입고 현황과 입고 이력을 통합 관리합니다"
        actions={
          <Link
            href="/materials/receiving/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            <Plus size={16} />
            입고 등록
          </Link>
        }
      />

      <ReceivingKpiCards
        monthlyCount={monthlyCount}
        monthlyAmount={monthlyAmount}
        pendingPOCount={pendingPOCount}
        overduePOCount={overduePOCount}
        pendingAmount={pendingAmount}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'pending'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Package size={14} />
              미입고 현황
              {pendingPOCount > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-bold rounded-full bg-orange-100 text-orange-700">
                  {pendingPOCount}
                </span>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'history'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <PackagePlus size={14} />
              입고 이력
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700">
                {incomingMovements.length}
              </span>
            </span>
          </button>
        </div>

        <input
          type="text"
          placeholder={
            activeTab === 'pending'
              ? '발주번호, 거래처, 자재명 검색...'
              : '자재명, 자재코드, 발주번호 검색...'
          }
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full sm:max-w-sm h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {activeTab === 'pending' && (
        <PendingPOPanel
          filteredPendingPOs={filteredPendingPOs}
          expandedPOs={expandedPOs}
          supplierById={supplierById}
          materialById={materialById}
          today={today}
          baseTimeMs={baseTimeMs}
          togglePO={togglePO}
          expandAll={expandAll}
          collapseAll={collapseAll}
        />
      )}

      {activeTab === 'history' && (
        <ReceivingHistoryPanel
          filteredMovements={filteredMovements}
          materialById={materialById}
          purchaseOrderById={purchaseOrderById}
        />
      )}
    </div>
  );
}
