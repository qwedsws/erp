'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMaterials } from '@/hooks/materials/useMaterials';
import { useStocks } from '@/hooks/materials/useStocks';
import { useSteelTags } from '@/hooks/procurement/useSteelTags';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/common/data-table';
import { Material, MaterialCategory, MATERIAL_CATEGORY_MAP, TOOL_TYPE_MAP, ToolType } from '@/types';
import { Plus, Package } from 'lucide-react';

export default function MaterialItemsPage() {
  const router = useRouter();
  const { materials } = useMaterials();
  const { stocks } = useStocks();
  const { steelTags } = useSteelTags();
  const [activeCategory, setActiveCategory] = useState<MaterialCategory | 'ALL'>('ALL');

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

  const filtered = activeCategory === 'ALL'
    ? materials
    : materials.filter(m => m.category === activeCategory);

  const columns = [
    {
      key: 'material_code',
      header: '자재코드',
      sortable: true,
      cell: (item: Material) => (
        <span className="font-mono text-xs">{item.material_code}</span>
      ),
    },
    {
      key: 'name',
      header: '자재명',
      sortable: true,
      cell: (item: Material) => (
        <div className="flex items-center gap-2">
          <Package size={16} className="text-muted-foreground shrink-0" />
          <span className="font-medium">{item.name}</span>
        </div>
      ),
    },
    {
      key: 'category',
      header: '분류',
      sortable: true,
      cell: (item: Material) => MATERIAL_CATEGORY_MAP[item.category] || item.category,
    },
    {
      key: 'specification',
      header: '규격/상세',
      cell: (item: Material) => {
        if (item.category === 'STEEL') {
          if (item.dimension_w && item.dimension_l && item.dimension_h) {
            return `${item.dimension_w}\u00D7${item.dimension_l}\u00D7${item.dimension_h}`;
          }
          // No dimensions on material — show grade with note
          return item.steel_grade
            ? `${item.steel_grade} (다양한 치수)`
            : '강재 (치수 미지정)';
        }
        if (item.category === 'TOOL' && item.tool_type) {
          return `\u03A6${item.tool_diameter} ${TOOL_TYPE_MAP[item.tool_type as ToolType]}`;
        }
        return item.specification || '-';
      },
    },
    {
      key: 'unit',
      header: '단위',
      cell: (item: Material) => {
        if (item.category === 'STEEL') {
          return 'KG / EA';
        }
        return item.unit;
      },
    },
    {
      key: 'unit_price',
      header: '단가',
      sortable: true,
      cell: (item: Material) => {
        if (item.category === 'STEEL' && item.price_per_kg != null) {
          return `${item.price_per_kg.toLocaleString()}원/kg`;
        }
        return item.unit_price ? `${item.unit_price.toLocaleString()}원` : '-';
      },
    },
    {
      key: 'stock_qty',
      header: '재고',
      cell: (item: Material) => {
        if (item.category === 'STEEL') {
          const stats = steelAvailableStatsByMaterialId.get(item.id);
          const count = stats?.count ?? 0;
          const totalWeight = stats?.totalWeight ?? 0;
          return `${count} EA (${totalWeight.toFixed(1)} kg)`;
        }
        const stock = stockByMaterialId.get(item.id);
        return `${stock?.quantity?.toLocaleString() || '0'} ${item.unit}`;
      },
    },
    {
      key: 'safety_stock',
      header: '안전재고',
      cell: (item: Material) => item.safety_stock != null ? item.safety_stock.toLocaleString() : '-',
    },
    {
      key: 'lead_time',
      header: '리드타임',
      cell: (item: Material) => item.lead_time != null ? `${item.lead_time}일` : '-',
    },
  ];

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
            onClick={() => setActiveCategory(cat as MaterialCategory | 'ALL')}
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
      <DataTable
        data={filtered}
        columns={columns}
        searchPlaceholder="자재명, 자재코드 검색..."
        searchKeys={['name', 'material_code']}
        onRowClick={(item) => router.push(`/materials/items/${item.id}`)}
      />
    </div>
  );
}
