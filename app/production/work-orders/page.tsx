'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkOrders } from '@/hooks/production/useWorkOrders';
import { useMachines } from '@/hooks/production/useMachines';
import { useProjects } from '@/hooks/projects/useProjects';
import { useProfiles } from '@/hooks/admin/useProfiles';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import { WORK_ORDER_STATUS_MAP, WorkOrderStatus } from '@/types';
import { Filter } from 'lucide-react';

export default function WorkOrdersPage() {
  const router = useRouter();
  const { workOrders } = useWorkOrders();
  const { machines } = useMachines();
  const { projects } = useProjects();
  const { profiles } = useProfiles();
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );
  const profileById = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile])),
    [profiles],
  );
  const machineById = useMemo(
    () => new Map(machines.map((machine) => [machine.id, machine])),
    [machines],
  );

  const filtered = useMemo(() => {
    return workOrders
      .filter((workOrder) => statusFilter === 'ALL' || workOrder.status === statusFilter)
      .filter((workOrder) => {
        if (!search) return true;
        const lower = search.toLowerCase();
        const project = projectById.get(workOrder.project_id);
        return workOrder.work_order_no.toLowerCase().includes(lower) ||
          (workOrder.description || '').toLowerCase().includes(lower) ||
          (project?.project_no || '').toLowerCase().includes(lower);
      })
      .sort((a, b) => {
        const statusOrder = { IN_PROGRESS: 0, READY: 1, PLANNED: 2, PAUSED: 3, COMPLETED: 4, CANCELLED: 5 };
        return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
      });
  }, [workOrders, statusFilter, search, projectById]);

  return (
    <div>
      <PageHeader
        title="작업 지시"
        description="작업 지시 현황을 관리합니다"
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1 text-sm">
          <Filter size={14} className="text-muted-foreground" />
          {(['ALL', 'IN_PROGRESS', 'READY', 'PLANNED', 'COMPLETED'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === status ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {status === 'ALL' ? '전체' : WORK_ORDER_STATUS_MAP[status].label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="작업지시번호, 설명, 프로젝트 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto h-9 w-64 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">작업지시번호</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">설명</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">프로젝트</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">담당자</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">설비</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">예정일</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(wo => {
              const project = projectById.get(wo.project_id);
              const worker = wo.worker_id ? profileById.get(wo.worker_id) : undefined;
              const machine = wo.machine_id ? machineById.get(wo.machine_id) : undefined;
              return (
                <tr
                  key={wo.id}
                  className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/30"
                  onClick={() => router.push(`/production/work-orders/${wo.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-xs">{wo.work_order_no}</td>
                  <td className="px-4 py-3 font-medium">{wo.description || '-'}</td>
                  <td className="px-4 py-3 text-xs">{project?.project_no || '-'}</td>
                  <td className="px-4 py-3">{worker?.name || '-'}</td>
                  <td className="px-4 py-3 text-xs">{machine?.name || '-'}</td>
                  <td className="px-4 py-3 text-xs">
                    {wo.planned_start ? new Date(wo.planned_start).toLocaleDateString('ko-KR') : '-'}
                    {wo.planned_end ? ` ~ ${new Date(wo.planned_end).toLocaleDateString('ko-KR')}` : ''}
                  </td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={wo.status} statusMap={WORK_ORDER_STATUS_MAP} /></td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">작업 지시가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">총 {filtered.length}건</div>
    </div>
  );
}
