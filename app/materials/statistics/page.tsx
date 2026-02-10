'use client';

import { useMemo } from 'react';
import { useMaterials } from '@/hooks/materials/useMaterials';
import { useStocks } from '@/hooks/materials/useStocks';
import { usePurchaseOrders } from '@/hooks/procurement/usePurchaseOrders';
import { useSuppliers } from '@/hooks/procurement/useSuppliers';
import { PageHeader } from '@/components/common/page-header';
import { MATERIAL_CATEGORY_MAP } from '@/types';
import { Package, DollarSign, TrendingDown, Truck } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function formatAmount(amount: number) {
  return (amount / 10000).toLocaleString() + '만원';
}

export default function MaterialsStatisticsPage() {
  const { materials } = useMaterials();
  const { stocks, stockMovements } = useStocks({ includeMovements: true });
  const { purchaseOrders } = usePurchaseOrders();
  const { suppliers } = useSuppliers();

  // Map indexes for O(1) lookups
  const materialById = useMemo(() => new Map(materials.map(m => [m.id, m])), [materials]);
  const supplierById = useMemo(() => new Map(suppliers.map(s => [s.id, s])), [suppliers]);
  const stockByMaterialId = useMemo(() => new Map(stocks.map(s => [s.material_id, s])), [stocks]);

  // KPI 1: 총 자재 품목
  const totalMaterialCount = materials.length;

  // KPI 2: 총 재고 금액
  const totalStockValue = useMemo(() => {
    return stocks.reduce((sum, stock) => {
      const material = materialById.get(stock.material_id);
      const unitPrice = material?.unit_price ?? 0;
      return sum + stock.quantity * unitPrice;
    }, 0);
  }, [stocks, materialById]);

  // Pre-aggregate OUT movements by month
  const outMovementsByMonth = useMemo(() => {
    const map = new Map<string, { totalAmount: number; totalQuantity: number }>();
    for (const sm of stockMovements) {
      if (sm.type !== 'OUT') continue;
      const key = sm.created_at.slice(0, 7);
      const material = materialById.get(sm.material_id);
      const unitPrice = sm.unit_price ?? material?.unit_price ?? 0;
      const amount = sm.quantity * unitPrice;
      const existing = map.get(key) ?? { totalAmount: 0, totalQuantity: 0 };
      existing.totalAmount += amount;
      existing.totalQuantity += sm.quantity;
      map.set(key, existing);
    }
    return map;
  }, [stockMovements, materialById]);

  // KPI 3: 월간 출고량 (current month, type='OUT')
  const monthlyOutQuantity = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return outMovementsByMonth.get(currentMonth)?.totalQuantity ?? 0;
  }, [outMovementsByMonth]);

  // Pre-aggregate PO amounts + status counts
  const purchaseOrderMetrics = useMemo(() => {
    const amountByMonth = new Map<string, number>();
    let activeOrderedCount = 0;
    for (const po of purchaseOrders) {
      const key = po.order_date.slice(0, 7);
      amountByMonth.set(key, (amountByMonth.get(key) ?? 0) + (po.total_amount ?? 0));
      if (po.status === 'ORDERED') {
        activeOrderedCount += 1;
      }
    }
    return { amountByMonth, activeOrderedCount };
  }, [purchaseOrders]);

  // KPI 4: 발주 진행 (status='ORDERED')
  const activePOCount = purchaseOrderMetrics.activeOrderedCount;

  // Chart 1: 월별 자재 소비 추이 (last 6 months, OUT movements)
  const monthlyConsumptionData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - 5 + i);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${d.getMonth() + 1}월`;
      const amount = outMovementsByMonth.get(month)?.totalAmount ?? 0;
      return { month: label, 소비금액: Math.round(amount / 10000) };
    });
  }, [outMovementsByMonth]);

  // Chart 2: 월별 발주 금액 추이 (last 6 months)
  const monthlyPOData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - 5 + i);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${d.getMonth() + 1}월`;
      const amount = purchaseOrderMetrics.amountByMonth.get(month) ?? 0;
      return { month: label, 발주금액: Math.round(amount / 10000) };
    });
  }, [purchaseOrderMetrics]);

  // Chart 3: 자재 분류별 재고 금액 (PieChart donut)
  const categoryStockData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    stocks.forEach(stock => {
      const material = materialById.get(stock.material_id);
      if (!material) return;
      const categoryLabel = MATERIAL_CATEGORY_MAP[material.category as keyof typeof MATERIAL_CATEGORY_MAP] || material.category;
      const value = stock.quantity * (material.unit_price ?? 0);
      categoryMap[categoryLabel] = (categoryMap[categoryLabel] || 0) + value;
    });
    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  }, [stocks, materialById]);

  // Chart 4: 거래처별 발주 금액 TOP5 (Horizontal BarChart)
  const supplierPOData = useMemo(() => {
    const supplierMap: Record<string, number> = {};
    purchaseOrders.forEach(po => {
      supplierMap[po.supplier_id] = (supplierMap[po.supplier_id] || 0) + (po.total_amount ?? 0);
    });
    return Object.entries(supplierMap)
      .map(([supplierId, amount]) => ({
        name: supplierById.get(supplierId)?.name || supplierId,
        금액: Math.round(amount / 10000),
      }))
      .sort((a, b) => b.금액 - a.금액)
      .slice(0, 5);
  }, [purchaseOrders, supplierById]);

  // Table: 안전재고 미달 자재
  const shortageItems = useMemo(() => {
    return materials
      .filter(m => {
        if (m.safety_stock == null || m.safety_stock <= 0) return false;
        const stock = stockByMaterialId.get(m.id);
        const currentQty = stock?.quantity ?? 0;
        return currentQty < m.safety_stock;
      })
      .map(m => {
        const stock = stockByMaterialId.get(m.id);
        const currentQty = stock?.quantity ?? 0;
        const shortage = m.safety_stock! - currentQty;
        const unitPrice = m.unit_price ?? 0;
        return {
          id: m.id,
          material_code: m.material_code,
          name: m.name,
          category: MATERIAL_CATEGORY_MAP[m.category as keyof typeof MATERIAL_CATEGORY_MAP] || m.category,
          currentQty,
          safetyStock: m.safety_stock!,
          shortage,
          unitPrice,
          replenishCost: shortage * unitPrice,
        };
      });
  }, [materials, stockByMaterialId]);

  return (
    <div>
      <PageHeader title="자재/구매 통계" description="자재 소비, 구매, 재고 현황을 분석합니다" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">총 자재 품목</p>
            <Package className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{totalMaterialCount}</p>
          <p className="text-xs text-muted-foreground mt-1">등록된 자재 품목 수</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">총 재고 금액</p>
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{formatAmount(totalStockValue)}</p>
          <p className="text-xs text-muted-foreground mt-1">현재 보유 재고 기준</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">월간 출고량</p>
            <TrendingDown className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{monthlyOutQuantity.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">이번달 출고 수량 합계</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">발주 진행</p>
            <Truck className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{activePOCount}</p>
          <p className="text-xs text-muted-foreground mt-1">발주완료 상태 건수</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 월별 자재 소비 추이 */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold mb-4">월별 자재 소비 추이 (만원)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyConsumptionData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip formatter={(value) => Number(value).toLocaleString() + '만원'} />
              <Legend />
              <Bar dataKey="소비금액" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 월별 발주 금액 추이 */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold mb-4">월별 발주 금액 추이 (만원)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyPOData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip formatter={(value) => Number(value).toLocaleString() + '만원'} />
              <Legend />
              <Bar dataKey="발주금액" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 자재 분류별 재고 금액 */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold mb-4">자재 분류별 재고 금액</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryStockData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {categoryStockData.map((_, index) => (
                  <Cell key={`cat-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatAmount(Number(value))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 거래처별 발주 금액 TOP5 */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold mb-4">거래처별 발주 금액 TOP5 (만원)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={supplierPOData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" className="text-xs" />
              <YAxis dataKey="name" type="category" className="text-xs" width={120} />
              <Tooltip formatter={(value) => Number(value).toLocaleString() + '만원'} />
              <Bar dataKey="금액" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 안전재고 미달 자재 테이블 */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">안전재고 미달 자재</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-medium">자재코드</th>
                <th className="text-left p-3 font-medium">자재명</th>
                <th className="text-left p-3 font-medium">분류</th>
                <th className="text-right p-3 font-medium">현재재고</th>
                <th className="text-right p-3 font-medium">안전재고</th>
                <th className="text-right p-3 font-medium">부족수량</th>
                <th className="text-right p-3 font-medium">단가</th>
                <th className="text-right p-3 font-medium">보충금액</th>
              </tr>
            </thead>
            <tbody>
              {shortageItems.length > 0 ? (
                shortageItems.map(item => (
                  <tr
                    key={item.id}
                    className="border-b border-border bg-red-50 dark:bg-red-950/20"
                  >
                    <td className="p-3 font-mono text-xs">{item.material_code}</td>
                    <td className="p-3">{item.name}</td>
                    <td className="p-3">{item.category}</td>
                    <td className="p-3 text-right">{item.currentQty.toLocaleString()}</td>
                    <td className="p-3 text-right">{item.safetyStock.toLocaleString()}</td>
                    <td className="p-3 text-right text-red-600 font-medium">{item.shortage.toLocaleString()}</td>
                    <td className="p-3 text-right">{item.unitPrice.toLocaleString()}원</td>
                    <td className="p-3 text-right font-medium">{formatAmount(item.replenishCost)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    안전재고 미달 자재가 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
