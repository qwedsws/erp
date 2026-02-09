'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useWorkOrders } from '@/hooks/production/useWorkOrders';
import { useMachines } from '@/hooks/production/useMachines';
import { useProjects } from '@/hooks/projects/useProjects';
import { useProfiles } from '@/hooks/admin/useProfiles';
import { PageHeader } from '@/components/common/page-header';
import { WorkOrderStatus } from '@/types';

const kanbanColumns: { status: WorkOrderStatus; label: string; color: string }[] = [
  { status: 'PLANNED', label: '계획', color: 'border-t-gray-400' },
  { status: 'READY', label: '준비완료', color: 'border-t-blue-400' },
  { status: 'IN_PROGRESS', label: '진행중', color: 'border-t-yellow-400' },
  { status: 'COMPLETED', label: '완료', color: 'border-t-green-400' },
];

export default function ProductionDashboardPage() {
  const { workOrders } = useWorkOrders();
  const { machines } = useMachines();
  const { projects } = useProjects();
  const { profiles } = useProfiles();

  // Map indexes for O(1) lookups
  const projectById = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);
  const profileById = useMemo(() => new Map(profiles.map(p => [p.id, p])), [profiles]);
  const machineById = useMemo(() => new Map(machines.map(m => [m.id, m])), [machines]);

  return (
    <div>
      <PageHeader title="현장 대시보드" description="작업 현황을 한눈에 확인합니다" />

      {/* Machine Status */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-3">설비 현황</h3>
        <div className="flex gap-3 flex-wrap">
          {machines.map(machine => (
            <div key={machine.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card">
              <div className={`w-2.5 h-2.5 rounded-full ${
                machine.status === 'RUNNING' ? 'bg-green-500' :
                machine.status === 'IDLE' ? 'bg-gray-300' :
                machine.status === 'MAINTENANCE' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-sm font-medium">{machine.name}</span>
              <span className="text-xs text-muted-foreground">({machine.machine_code})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {kanbanColumns.map(col => {
          const items = workOrders.filter(wo => wo.status === col.status);
          return (
            <div key={col.status} className="flex-shrink-0 w-72">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{items.length}</span>
              </div>
              <div className={`space-y-2 min-h-[200px] p-2 rounded-lg bg-muted/30 border-t-4 ${col.color}`}>
                {items.map(wo => {
                  const project = projectById.get(wo.project_id);
                  const worker = wo.worker_id ? profileById.get(wo.worker_id) : undefined;
                  const machine = wo.machine_id ? machineById.get(wo.machine_id) : undefined;
                  return (
                    <Link key={wo.id} href={`/production/work-orders/${wo.id}`} className="block p-3 rounded-lg border border-border bg-card hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{wo.work_order_no}</span>
                      </div>
                      <p className="text-sm font-medium truncate">{wo.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        {project && <span className="font-mono">{project.project_no}</span>}
                        {worker && <span>| {worker.name}</span>}
                      </div>
                      {machine && <p className="text-xs text-muted-foreground mt-1">{machine.name}</p>}
                    </Link>
                  );
                })}
                {items.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground">없음</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
