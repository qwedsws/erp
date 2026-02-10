'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMaterialListQuery } from '@/hooks/materials/useMaterialListQuery';
import { useStocks } from '@/hooks/materials/useStocks';
import { useSteelTags } from '@/hooks/procurement/useSteelTags';
import { PageHeader } from '@/components/common/page-header';
import { TablePagination } from '@/components/common/table-pagination';
import { Material, MaterialCategory, MATERIAL_CATEGORY_MAP, TOOL_TYPE_MAP, ToolType } from '@/types';
import { Plus, Package, Loader2, Search } from 'lucide-react';

export default function MaterialItemsPage() {
  const router = useRouter();
  const { stocks } = useStocks();
  const { steelTags } = useSteelTags();
  const [activeCategory, setActiveCategory] = useState<MaterialCategory | 'ALL'>('ALL');
  const [searchInput, setSearchInput] = useState('');

  const {
    items,
    total,
    page,
    pageSize,
    isLoading,
    setPage,
    setSearch,
    setCategory,
  } = useMaterialListQuery();

  const stockByMaterialId = useMemo(() => new Map(stocks.map(s => [s.material_id, s])), [stocks]);
  const steelAvailableStatsByMaterialId = useMemo(() => {
    const map = new Map<string, { count: number; totalWeight: number }>();
    for (const tag of steelTags) {
      if (tag.status !== 'AVAILABLE') continue;
      const existing = map.get(tag.material_id) ?? { count: 0, totalWeight: 0 };
      existing.count += 1;
      existing.totalWeight += tag.weight;
      map.set(tag.material_id, existing);
    }
    return map;
  }, [steelTags]);

  function handleCategoryChange(cat: MaterialCategory | 'ALL') {
    setActiveCategory(cat);
    setCategory(cat === 'ALL' ? undefined : cat);
  }

  function handleSearchChange(value: string) {
    setSearchInput(value);
    setSearch(value);
  }

  function renderSpecification(item: Material) {
    if (item.category === 'STEEL') {
      if (item.dimension_w && item.dimension_l && item.dimension_h) {
        return `${item.dimension_w}\u00D7${item.dimension_l}\u00D7${item.dimension_h}`;
      }
      return item.steel_grade
        ? `${item.steel_grade} (다양한 치수)`
        : '강재 (치수 미지정)';
    }
    if (item.category === 'TOOL' && item.tool_type) {
      return `\u03A6${item.tool_diameter} ${TOOL_TYPE_MAP[item.tool_type as ToolType]}`;
    }
    return item.specification || '-';
  }

  function renderStock(item: Material) {
    if (item.category === 'STEEL') {
      const stats = steelAvailableStatsByMaterialId.get(item.id);
      const count = stats?.count ?? 0;
      const totalWeight = stats?.totalWeight ?? 0;
      return `${count} EA (${totalWeight.toFixed(1)} kg)`;
    }
    const stock = stockByMaterialId.get(item.id);
    return `${stock?.quantity?.toLocaleString() || '0'} ${item.unit}`;
  }

  function renderUnitPrice(item: Material) {
    if (item.category === 'STEEL' && item.price_per_kg != null) {
      return `${item.price_per_kg.toLocaleString()}원/kg`;
    }
    return item.unit_price ? `${item.unit_price.toLocaleString()}원` : '-';
  }

  return (
    <div>
      <PageHeader
        title="자재 마스터"
        description="자재 품목 정보를 관리합니다"
        actions={
          <Link
            href="/materials/items/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            <Plus size={16} />
            자재 등록
          </Link>
        }
      />
      <div className="flex items-center gap-1 mb-4 border-b border-border">
        {(['ALL', ...Object.keys(MATERIAL_CATEGORY_MAP)] as const).map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat as MaterialCategory | 'ALL')}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeCategory === cat
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat === 'ALL' ? '전체' : MATERIAL_CATEGORY_MAP[cat as MaterialCategory]}
          </button>
        ))}
      </div>

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
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">규격/상세</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">단위</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">단가</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">재고</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">안전재고</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">리드타임</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    데이터를 불러오는 중...
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  자재 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/30"
                  onClick={() => router.push(`/materials/items/${item.id}`)}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs">{item.material_code}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-muted-foreground shrink-0" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {MATERIAL_CATEGORY_MAP[item.category] || item.category}
                  </td>
                  <td className="px-4 py-3">{renderSpecification(item)}</td>
                  <td className="px-4 py-3">
                    {item.category === 'STEEL' ? 'KG / EA' : item.unit}
                  </td>
                  <td className="px-4 py-3">{renderUnitPrice(item)}</td>
                  <td className="px-4 py-3">{renderStock(item)}</td>
                  <td className="px-4 py-3">
                    {item.safety_stock != null ? item.safety_stock.toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {item.lead_time != null ? `${item.lead_time}일` : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePagination
        totalCount={total}
        currentPage={page}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
}
