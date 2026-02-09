'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/projects/useProjects';
import { useCustomers } from '@/hooks/sales/useCustomers';
import { useOrders } from '@/hooks/sales/useOrders';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import { PROJECT_STATUS_MAP, MOLD_TYPE_MAP, PRIORITY_MAP, ProjectStatus } from '@/types';
import { Plus, List, LayoutGrid, CalendarDays } from 'lucide-react';

export default function ProjectsPage() {
  const router = useRouter();
  const { projects } = useProjects();
  const { customers } = useCustomers();
  const { orders } = useOrders();
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL');

  // Map indexes for O(1) lookups
  const orderById = useMemo(() => new Map(orders.map(o => [o.id, o])), [orders]);
  const customerById = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);

  const filtered = projects
    .filter(p => statusFilter === 'ALL' || p.status === statusFilter)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const getCustomerName = (project: typeof projects[0]) => {
    if (!project.order_id) return '-';
    const order = orderById.get(project.order_id);
    if (!order) return '-';
    const customer = customerById.get(order.customer_id);
    return customer?.name || '-';
  };

  // Kanban columns
  const kanbanColumns = [
    { status: 'CONFIRMED' as ProjectStatus, label: '수주확정' },
    { status: 'DESIGNING' as ProjectStatus, label: '설계중' },
    { status: 'MACHINING' as ProjectStatus, label: '가공중' },
    { status: 'ASSEMBLING' as ProjectStatus, label: '조립중' },
    { status: 'TRYOUT' as ProjectStatus, label: '트라이아웃' },
  ];

  return (
    <div>
      <PageHeader
        title="프로젝트 관리"
        description="금형 프로젝트 현황을 관리합니다"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-input rounded-md">
              <button onClick={() => setView('table')} className={`p-2 ${view === 'table' ? 'bg-muted' : 'hover:bg-muted/50'}`}><List size={16} /></button>
              <button onClick={() => setView('kanban')} className={`p-2 ${view === 'kanban' ? 'bg-muted' : 'hover:bg-muted/50'}`}><LayoutGrid size={16} /></button>
              <Link href="/projects/calendar" className="p-2 hover:bg-muted/50"><CalendarDays size={16} /></Link>
            </div>
            <Link href="/projects/new" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">
              <Plus size={16} /> 프로젝트 생성
            </Link>
          </div>
        }
      />

      {view === 'table' ? (
        <>
          <div className="flex items-center gap-1 mb-4 flex-wrap">
            {(['ALL', 'CONFIRMED', 'DESIGNING', 'DESIGN_COMPLETE', 'MATERIAL_PREP', 'MACHINING', 'ASSEMBLING', 'TRYOUT', 'DELIVERED'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                {s === 'ALL' ? '전체' : PROJECT_STATUS_MAP[s]?.label || s}
              </button>
            ))}
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">프로젝트번호</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">프로젝트명</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">고객사</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">금형종류</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">납기일</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">우선순위</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">상태</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(project => {
                  const isOverdue = new Date(project.due_date) < new Date() && !['DELIVERED', 'SHIPPED', 'AS_SERVICE'].includes(project.status);
                  return (
                    <tr key={project.id} className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/30" onClick={() => router.push(`/projects/${project.id}`)}>
                      <td className="px-4 py-3 font-mono text-xs">{project.project_no}</td>
                      <td className="px-4 py-3 font-medium">{project.name}</td>
                      <td className="px-4 py-3">{getCustomerName(project)}</td>
                      <td className="px-4 py-3">{MOLD_TYPE_MAP[project.mold_type]}</td>
                      <td className={`px-4 py-3 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>{project.due_date}</td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={project.priority} statusMap={PRIORITY_MAP} /></td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={project.status} statusMap={PROJECT_STATUS_MAP} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">총 {filtered.length}건</div>
        </>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map(col => {
            const items = projects.filter(p => p.status === col.status);
            return (
              <div key={col.status} className="flex-shrink-0 w-72">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map(project => (
                    <Link key={project.id} href={`/projects/${project.id}`} className="block p-3 rounded-lg border border-border bg-card hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{project.project_no}</span>
                        <StatusBadge status={project.priority} statusMap={PRIORITY_MAP} />
                      </div>
                      <p className="text-sm font-medium">{project.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{MOLD_TYPE_MAP[project.mold_type]} | 납기: {project.due_date}</p>
                    </Link>
                  ))}
                  {items.length === 0 && (
                    <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border rounded-lg">없음</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
