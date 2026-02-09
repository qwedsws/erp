'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/projects/useProjects';
import { useProcessSteps } from '@/hooks/projects/useProcessSteps';
import { useWorkOrders } from '@/hooks/production/useWorkOrders';
import { useWorkLogs } from '@/hooks/production/useWorkLogs';
import { useOrders } from '@/hooks/sales/useOrders';
import { useCustomers } from '@/hooks/sales/useCustomers';
import { useProfiles } from '@/hooks/admin/useProfiles';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import { PROJECT_STATUS_MAP, MOLD_TYPE_MAP, PRIORITY_MAP } from '@/types';
import { ArrowLeft } from 'lucide-react';
import { ProjectOverviewTab } from './_components/project-overview-tab';
import { ProjectDesignTab } from './_components/project-design-tab';
import { ProjectProcessesTab } from './_components/project-processes-tab';
import { ProjectCostTab } from './_components/project-cost-tab';

const TABS = [
  { id: 'overview' as const, label: '개요' },
  { id: 'design' as const, label: '설계 공정' },
  { id: 'process' as const, label: '공정 현황' },
  { id: 'cost' as const, label: '원가' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { projects } = useProjects();
  const { orders } = useOrders();
  const { customers } = useCustomers();
  const { profiles } = useProfiles();
  const { processSteps, progressDesignStep } = useProcessSteps();
  const { workOrders } = useWorkOrders();
  const { workLogs } = useWorkLogs();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const projectId = typeof params.id === 'string' ? params.id : params.id?.[0];

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const orderById = useMemo(() => new Map(orders.map((o) => [o.id, o])), [orders]);
  const customerById = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const profileById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const project = projectId ? projectById.get(projectId) : undefined;
  const order = project?.order_id ? orderById.get(project.order_id) ?? null : null;
  const customer = order ? customerById.get(order.customer_id) ?? null : null;
  const manager = project?.manager_id ? profileById.get(project.manager_id) ?? null : null;

  const steps = useMemo(
    () =>
      processSteps
        .filter((step) => step.project_id === project?.id)
        .sort((a, b) => a.sequence - b.sequence),
    [processSteps, project?.id],
  );
  const projectWOs = useMemo(
    () => workOrders.filter((wo) => wo.project_id === project?.id),
    [workOrders, project?.id],
  );
  const projectWOIdSet = useMemo(
    () => new Set(projectWOs.map((wo) => wo.id)),
    [projectWOs],
  );
  const projectLogs = useMemo(
    () => workLogs.filter((wl) => projectWOIdSet.has(wl.work_order_id)),
    [workLogs, projectWOIdSet],
  );

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">프로젝트를 찾을 수 없습니다.</p>
        <button onClick={() => router.push('/projects')} className="mt-4 text-primary hover:underline text-sm">목록으로 돌아가기</button>
      </div>
    );
  }

  const completedSteps = steps.filter(s => s.status === 'COMPLETED').length;
  const progressPct = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;

  const ctx = { project, order, customer, manager, steps, projectWOs, projectLogs, profileById };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.push('/projects')} className="p-1 rounded hover:bg-accent"><ArrowLeft size={18} /></button>
        <span className="text-sm text-muted-foreground">프로젝트 관리</span>
      </div>
      <PageHeader
        title={project.name}
        description={`${project.project_no} | ${MOLD_TYPE_MAP[project.mold_type]}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={project.priority} statusMap={PRIORITY_MAP} />
            <StatusBadge status={project.status} statusMap={PROJECT_STATUS_MAP} />
          </div>
        }
      />

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-muted-foreground">전체 진행률</span>
          <span className="font-medium">{progressPct}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <ProjectOverviewTab ctx={ctx} />}
      {activeTab === 'design' && (
        <ProjectDesignTab
          projectId={project.id}
          steps={steps}
          projectWOs={projectWOs}
          workLogs={workLogs}
          profileById={profileById}
          progressDesignStep={progressDesignStep}
        />
      )}
      {activeTab === 'process' && <ProjectProcessesTab steps={steps} profileById={profileById} />}
      {activeTab === 'cost' && <ProjectCostTab order={order} projectLogs={projectLogs} profileById={profileById} />}
    </div>
  );
}
