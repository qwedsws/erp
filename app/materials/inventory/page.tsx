'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/common/data-table';
import { useInventoryPageData } from '@/hooks/materials/useInventoryPageData';
import { MATERIAL_CATEGORY_MAP } from '@/types';
import { AlertTriangle, ClipboardCheck, DollarSign, Package, PackageMinus, Settings2, Tag } from 'lucide-react';
import { SteelTagSection } from './_components/steel-tag-section';

interface InventoryRow {
  id: string;
  material_code: string;
  name: string;
  category: string;
  specification: string;
  unit: string;
  quantity: number;
  safety_stock: number;
  location_code: string;
  unit_price: number;
  isLowStock: boolean;
  [key: string]: unknown;
}

export default function InventoryPage() {
  const router = useRouter();
  const {
    activeTab,
    setActiveTab,
    allocatingTagId,
    allocateProjectId,
    setAllocateProjectId,
    projects,
    steelTagData,
    steelTagStats,
    inventoryData,
    totalItems,
    lowStockCount,
    totalValue,
    getAvailableActions,
    startAllocate,
    cancelAllocate,
    confirmAllocate,
    handleIssueTag,
    handleCompleteTag,
    handleScrapTag,
  } = useInventoryPageData();

  const columns = useMemo(() => {
    return [
      { key: 'material_code', header: '자재코드', sortable: true },
      {
        key: 'name',
        header: '자재명',
        sortable: true,
        cell: (item: InventoryRow) => (
          <button
            onClick={() => router.push(`/materials/items/${item.id}`)}
            className={`hover:underline ${item.isLowStock ? 'text-red-600 font-medium' : 'text-primary font-medium'}`}
          >
            {item.name}
          </button>
        ),
      },
      {
        key: 'category',
        header: '분류',
        cell: (item: InventoryRow) =>
          MATERIAL_CATEGORY_MAP[item.category as keyof typeof MATERIAL_CATEGORY_MAP] || item.category,
      },
      { key: 'specification', header: '규격' },
      { key: 'unit', header: '단위' },
      {
        key: 'quantity',
        header: '현재 수량',
        sortable: true,
        cell: (item: InventoryRow) => (
          <span className={item.isLowStock ? 'text-red-600 font-bold' : ''}>
            {item.quantity.toLocaleString()}
          </span>
        ),
      },
      {
        key: 'safety_stock',
        header: '안전재고',
        cell: (item: InventoryRow) => item.safety_stock.toLocaleString(),
      },
      { key: 'location_code', header: '위치' },
    ];
  }, [router]);

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
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-4">
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
        </div>
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-4">
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
        </div>
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
        <DataTable
          data={inventoryData}
          columns={columns}
          searchPlaceholder="자재명, 자재코드 검색..."
          searchKeys={['name', 'material_code']}
        />
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
