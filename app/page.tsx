'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useProjects } from '@/hooks/projects/useProjects';
import { useOrders } from '@/hooks/sales/useOrders';
import { useWorkOrders } from '@/hooks/production/useWorkOrders';
import { useProfiles } from '@/hooks/admin/useProfiles';
import { useMaterials } from '@/hooks/materials/useMaterials';
import { useStocks } from '@/hooks/materials/useStocks';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import { PROJECT_STATUS_MAP, MOLD_TYPE_MAP, PRIORITY_MAP, WORK_ORDER_STATUS_MAP } from '@/types';
import {
  FolderKanban,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

export default function DashboardPage() {
  const { projects } = useProjects();
  const { orders } = useOrders();
  const { workOrders } = useWorkOrders();
  const { profiles } = useProfiles();
  const { materials } = useMaterials();
  const { stocks } = useStocks();

  const stockByMaterialId = useMemo(
    () => new Map(stocks.map((stock) => [stock.material_id, stock])),
    [stocks],
  );
  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );
  const profileById = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile])),
    [profiles],
  );

  const lowStockItems = useMemo(() => {
    return materials.filter((material) => {
      const stock = stockByMaterialId.get(material.id);
      const quantity = stock?.quantity ?? 0;
      return quantity < (material.safety_stock ?? 0);
    });
  }, [materials, stockByMaterialId]);

  // Single-pass dashboard aggregations
  const dashboardMetrics = useMemo(() => {
    const now = new Date();
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const activeProjects: typeof projects = [];
    const completedProjects: typeof projects = [];
    const statusCounts: Record<string, number> = {};
    let delayedProjectCount = 0;
    let onTimeDeliveredCount = 0;

    for (const project of projects) {
      const isActive = project.status !== 'DELIVERED' && project.status !== 'AS_SERVICE';
      if (isActive) {
        activeProjects.push(project);
        if (new Date(project.due_date) < now) {
          delayedProjectCount++;
        }
        const label = PROJECT_STATUS_MAP[project.status]?.label || project.status;
        statusCounts[label] = (statusCounts[label] || 0) + 1;
      }

      if (project.status === 'DELIVERED') {
        completedProjects.push(project);
        if (project.completed_date && new Date(project.completed_date) <= new Date(project.due_date)) {
          onTimeDeliveredCount++;
        }
      }
    }

    const ordersByMonth = new Map<string, { count: number; amount: number }>();
    for (const order of orders) {
      const key = order.order_date.slice(0, 7);
      const existing = ordersByMonth.get(key) ?? { count: 0, amount: 0 };
      existing.count += 1;
      existing.amount += order.total_amount || 0;
      ordersByMonth.set(key, existing);
    }

    const thisMonthOrders = ordersByMonth.get(thisMonthKey) ?? { count: 0, amount: 0 };
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - 5 + i);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${d.getMonth() + 1}월`;
      const agg = ordersByMonth.get(month) ?? { count: 0, amount: 0 };
      return { month: label, 건수: agg.count, 금액: Math.round(agg.amount / 10000) };
    });

    return {
      activeProjects,
      completedProjectsCount: completedProjects.length,
      delayedProjectCount,
      deliveryRate:
        completedProjects.length > 0
          ? Math.round((onTimeDeliveredCount / completedProjects.length) * 100)
          : 100,
      statusChartData: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
      thisMonthOrderCount: thisMonthOrders.count,
      thisMonthOrderAmount: thisMonthOrders.amount,
      monthlyData,
      activeWOs: workOrders.filter((workOrder) => workOrder.status === 'IN_PROGRESS'),
    };
  }, [projects, orders, workOrders]);

  return (
    <div>
      <PageHeader title="대시보드" description="금형 제조 현황을 한눈에 확인하세요" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">진행중 프로젝트</p>
            <FolderKanban className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{dashboardMetrics.activeProjects.length}</p>
          <p className="text-xs text-muted-foreground mt-1">전체 {projects.length}건</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">이번달 수주</p>
            <ShoppingCart className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{dashboardMetrics.thisMonthOrderCount}건</p>
          <p className="text-xs text-muted-foreground mt-1">
            {(dashboardMetrics.thisMonthOrderAmount / 100000000).toFixed(1)}억원
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">납기 준수율</p>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{dashboardMetrics.deliveryRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">완료 {dashboardMetrics.completedProjectsCount}건 기준</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">지연 프로젝트</p>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold mt-2 text-red-600">{dashboardMetrics.delayedProjectCount}</p>
          <p className="text-xs text-muted-foreground mt-1">즉시 조치 필요</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-4">
          <div className={`p-2.5 rounded-lg ${lowStockItems.length > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
            <AlertTriangle size={20} className={lowStockItems.length > 0 ? 'text-red-600' : 'text-green-600'} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">재고 부족</p>
            <p className={`text-2xl font-bold ${lowStockItems.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {lowStockItems.length}<span className="text-sm font-normal text-muted-foreground ml-1">건</span>
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold mb-4">프로젝트 상태 현황</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardMetrics.statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {dashboardMetrics.statusChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold mb-4">월별 수주 추이 (만원)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardMetrics.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="금액" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects */}
        <div className="rounded-lg border border-border bg-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">진행중 프로젝트</h3>
            <Link href="/projects" className="text-sm text-primary hover:underline">전체보기</Link>
          </div>
          <div className="divide-y divide-border">
            {dashboardMetrics.activeProjects.slice(0, 5).map(project => (
              <Link key={project.id} href={`/projects/${project.id}`} className="flex items-center justify-between p-4 hover:bg-muted/30">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">{project.project_no}</span>
                    <StatusBadge status={project.priority} statusMap={PRIORITY_MAP} />
                  </div>
                  <p className="font-medium mt-0.5 truncate">{project.name}</p>
                  <p className="text-xs text-muted-foreground">{MOLD_TYPE_MAP[project.mold_type]} | 납기: {project.due_date}</p>
                </div>
                <StatusBadge status={project.status} statusMap={PROJECT_STATUS_MAP} />
              </Link>
            ))}
          </div>
        </div>

        {/* Active Work Orders */}
        <div className="rounded-lg border border-border bg-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">진행중 작업</h3>
            <Link href="/production/work-orders" className="text-sm text-primary hover:underline">전체보기</Link>
          </div>
          <div className="divide-y divide-border">
            {dashboardMetrics.activeWOs.map(wo => {
              const project = projectById.get(wo.project_id);
              const worker = wo.worker_id ? profileById.get(wo.worker_id) : undefined;
              return (
                <Link key={wo.id} href={`/production/work-orders/${wo.id}`} className="flex items-center justify-between p-4 hover:bg-muted/30">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">{wo.work_order_no}</span>
                    </div>
                    <p className="font-medium mt-0.5 truncate">{wo.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {project && <span>{project.project_no}</span>}
                      {worker && <span>담당: {worker.name}</span>}
                      {wo.actual_start && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(wo.actual_start).toLocaleDateString('ko-KR')} ~
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={wo.status} statusMap={WORK_ORDER_STATUS_MAP} />
                </Link>
              );
            })}
            {dashboardMetrics.activeWOs.length === 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">진행중인 작업이 없습니다</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
