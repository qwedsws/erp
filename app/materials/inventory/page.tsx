'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/common/page-header';
import { TablePagination } from '@/components/common/table-pagination';
import { useInventoryPageData } from '@/hooks/materials/useInventoryPageData';
import { MATERIAL_CATEGORY_MAP } from '@/types';
import {
  AlertTriangle,
  ClipboardCheck,
  DollarSign,
  Loader2,
  Package,
  PackageMinus,
  Search,
  Settings2,
  Tag,
} from 'lucide-react';
import { SteelTagSection } from './_components/steel-tag-section';

export default function InventoryPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const {
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
    setShowLowStockOnly,
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
    // Tag actions
    getAvailableActions,
    startAllocate,
    cancelAllocate,
    confirmAllocate,
    handleIssueTag,
    handleCompleteTag,
    handleScrapTag,
  } = useInventoryPageData();

  function handleSearchChange(value: string) {
    setSearchInput(value);
    setSearch(value);
  }

  return (
    <div>
      <PageHeader
        title="재고 현황"
        description="자재별 재고 수량 및 부족 현황을 확인합니다"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/materials/inventory/stock-out"
              className="inline-flex items-center gap-2 px-3 py-2 border border-input rounded-md text-sm hover:bg-accent"
            >
              <PackageMinus size={14} /> 출고
            </Link>
            <Link
              href="/materials/inventory/adjust"
              className="inline-flex items-center gap-2 px-3 py-2 border border-input rounded-md text-sm hover:bg-accent"
            >
              <Settings2 size={14} /> 조정
            </Link>
            <Link
              href="/materials/inventory/stocktake"
              className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            >
              <ClipboardCheck size={14} /> 재고 실사
            </Link>
          </div>
        }
      />

      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 mb-4">
          <AlertTriangle size={20} className="text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">안전재고 미달 경고</p>
            <p className="text-sm text-red-600">
              {lowStockCount}개 자재의 재고가 안전재고 수준 이하입니다. 구매 요청을 검토해주세요.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setShowLowStockOnly(false)}
          className={`rounded-lg border bg-card p-4 flex items-center gap-4 text-left cursor-pointer transition-all ${
            !showLowStockOnly ? 'border-blue-400 ring-2 ring-blue-200' : 'border-border hover:border-blue-300'
          }`}
        >
          <div className="p-2.5 rounded-lg bg-blue-50">
            <Package size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">총 자재 품목</p>
            <p className="text-2xl font-bold">
              {totalItems}
              <span className="text-sm font-normal text-muted-foreground ml-1">건</span>
            </p>
          </div>
        </button>
        <button
          onClick={() => setShowLowStockOnly(true)}
          className={`rounded-lg border bg-card p-4 flex items-center gap-4 text-left cursor-pointer transition-all ${
            showLowStockOnly ? 'border-red-400 ring-2 ring-red-200' : 'border-border hover:border-red-300'
          }`}
        >
          <div className="p-2.5 rounded-lg bg-red-50">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">재고 부족 경고</p>
            <p className="text-2xl font-bold text-red-600">
              {lowStockCount}
              <span className="text-sm font-normal text-muted-foreground ml-1">건</span>
            </p>
          </div>
        </button>
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-green-50">
            <DollarSign size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">총 재고 금액</p>
            <p className="text-2xl font-bold">
              {(totalValue / 10000).toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground ml-1">만원</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-4 border-b border-border">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          전체 재고
        </button>
        <button
          onClick={() => setActiveTab('steel_tags')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'steel_tags'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Tag size={14} />
          강재 태그
          {steelTagStats.total > 0 && (
            <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">{steelTagStats.total}</span>
          )}
        </button>
      </div>

      {activeTab === 'all' ? (
        <>
          <div className="mb-4">
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
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">자재코드</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">자재명</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">분류</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">규격</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">단위</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">현재 수량</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">안전재고</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">위치</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        데이터를 불러오는 중...
                      </div>
                    </td>
                  </tr>
                ) : inventoryRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      {showLowStockOnly ? '재고 부족 품목이 없습니다.' : '재고 데이터가 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  inventoryRows.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/30"
                      onClick={() => router.push(`/materials/items/${item.id}`)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs">{item.material_code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${item.isLowStock ? 'text-red-600' : 'text-primary'}`}>
                          {item.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {MATERIAL_CATEGORY_MAP[item.category as keyof typeof MATERIAL_CATEGORY_MAP] || item.category}
                      </td>
                      <td className="px-4 py-3">{item.specification}</td>
                      <td className="px-4 py-3">{item.unit}</td>
                      <td className="px-4 py-3">
                        <span className={item.isLowStock ? 'text-red-600 font-bold' : ''}>
                          {item.quantity.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">{item.safety_stock.toLocaleString()}</td>
                      <td className="px-4 py-3">{item.location_code}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            totalCount={pageTotal}
            currentPage={page}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </>
      ) : (
        <SteelTagSection
          projects={projects}
          steelTagData={steelTagData}
          steelTagStats={steelTagStats}
          allocatingTagId={allocatingTagId}
          allocateProjectId={allocateProjectId}
          setAllocateProjectId={setAllocateProjectId}
          getAvailableActions={getAvailableActions}
          startAllocate={startAllocate}
          cancelAllocate={cancelAllocate}
          confirmAllocate={confirmAllocate}
          handleIssueTag={handleIssueTag}
          handleCompleteTag={handleCompleteTag}
          handleScrapTag={handleScrapTag}
        />
      )}
    </div>
  );
}
