'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useProjects } from '@/hooks/projects/useProjects';
import { useProcessSteps } from '@/hooks/projects/useProcessSteps';
import { useProfiles } from '@/hooks/admin/useProfiles';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import { PROJECT_STATUS_MAP } from '@/types';
import { CheckCircle2, Clock, Circle, FolderKanban, UserPlus, Settings2 } from 'lucide-react';

type FilterTab = 'ALL' | 'IN_PROGRESS' | 'PLANNED' | 'COMPLETED';

const STEP_STATUS_CONFIG = {
  COMPLETED: { label: '완료', color: 'text-green-600', icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
  IN_PROGRESS: { label: '진행중', color: 'text-blue-600', icon: <Clock className="h-4 w-4 text-blue-500" /> },
  PLANNED: { label: '대기', color: 'text-gray-500', icon: <Circle className="h-4 w-4 text-gray-400" /> },
  ON_HOLD: { label: '보류', color: 'text-yellow-600', icon: <Circle className="h-4 w-4 text-yellow-500" /> },
  SKIPPED: { label: '건너뜀', color: 'text-gray-400', icon: <Circle className="h-4 w-4 text-gray-300" /> },
} as const;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'IN_PROGRESS', label: '진행중' },
  { key: 'PLANNED', label: '대기' },
  { key: 'COMPLETED', label: '완료' },
];

export default function DesignProcessesPage() {
  const { projects } = useProjects();
  const { processSteps } = useProcessSteps();
  const { profiles } = useProfiles();
  const [filter, setFilter] = useState<FilterTab>('ALL');

  // All design steps
  const designSteps = useMemo(
    () => processSteps.filter((s) => s.category === 'DESIGN'),
    [processSteps]
  );

  // KPI calculations
  const kpi = useMemo(() => {
    const total = designSteps.length;
    const inProgress = designSteps.filter((s) => s.status === 'IN_PROGRESS').length;
    const completed = designSteps.filter((s) => s.status === 'COMPLETED').length;
    const unassigned = designSteps.filter((s) => !s.assignee_id).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, inProgress, completed, completionRate, unassigned };
  }, [designSteps]);

  // Group design steps by project, applying filter
  const projectGroups = useMemo(() => {
    // Build a map of project_id -> filtered steps
    const grouped = new Map<string, typeof designSteps>();
    for (const step of designSteps) {
      if (filter !== 'ALL' && step.status !== filter) continue;
      const existing = grouped.get(step.project_id);
      if (existing) {
        existing.push(step);
      } else {
        grouped.set(step.project_id, [step]);
      }
    }

    // Sort steps within each project by sequence
    for (const steps of grouped.values()) {
      steps.sort((a, b) => a.sequence - b.sequence);
    }

    // Build result with project info and design progress
    return Array.from(grouped.entries()).map(([projectId, steps]) => {
      const project = projects.find((p) => p.id === projectId);
      // Always calculate progress against ALL design steps for the project (not filtered)
      const allProjectDesignSteps = designSteps.filter((s) => s.project_id === projectId);
      const completedCount = allProjectDesignSteps.filter((s) => s.status === 'COMPLETED').length;
      const totalCount = allProjectDesignSteps.length;
      const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      return {
        projectId,
        project,
        steps,
        progress,
        completedCount,
        totalCount,
      };
    });
  }, [designSteps, projects, filter]);

  const getAssigneeName = (assigneeId?: string) => {
    if (!assigneeId) return '-';
    const profile = profiles.find((p) => p.id === assigneeId);
    return profile?.name ?? '-';
  };

  return (
    <div>
      <PageHeader
        title="설계 공정 현황"
        description="전체 프로젝트의 설계 공정 진행 상태를 확인합니다"
      />

      <div className="flex justify-end mb-4">
        <Link
          href="/design/manage"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Settings2 className="h-4 w-4" />
          설계 공정 관리
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">전체 설계 공정</p>
            <FolderKanban className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{kpi.total}</p>
          <p className="text-xs text-muted-foreground mt-1">전체 프로젝트 설계 공정 수</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">진행중</p>
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{kpi.inProgress}</p>
          <p className="text-xs text-muted-foreground mt-1">현재 진행중인 설계 공정</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">완료</p>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{kpi.completed}</p>
          <p className="text-xs text-muted-foreground mt-1">완료된 설계 공정</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">완료율</p>
            <CheckCircle2 className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{kpi.completionRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {kpi.completed}/{kpi.total} 공정 완료
          </p>
        </div>
        <div className={`rounded-lg border p-4 ${kpi.unassigned > 0 ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' : 'border-border bg-card'}`}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">미배정</p>
            <UserPlus className={`h-5 w-5 ${kpi.unassigned > 0 ? 'text-yellow-500' : 'text-gray-400'}`} />
          </div>
          <p className={`text-3xl font-bold mt-2 ${kpi.unassigned > 0 ? 'text-yellow-600' : ''}`}>{kpi.unassigned}</p>
          <p className="text-xs text-muted-foreground mt-1">담당자 미배정 공정</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-6">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 text-sm rounded-md ${
              filter === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Project-grouped design steps */}
      {projectGroups.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          {designSteps.length === 0
            ? '등록된 설계 공정이 없습니다.'
            : '해당 상태의 설계 공정이 없습니다.'}
        </div>
      ) : (
        <div className="space-y-4">
          {projectGroups.map(({ projectId, project, steps, progress, completedCount, totalCount }) => (
            <div key={projectId} className="rounded-lg border border-border bg-card">
              {/* Project header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono">
                      {project?.project_no ?? projectId}
                    </span>
                    <Link
                      href={`/projects/${projectId}`}
                      className="font-semibold hover:underline"
                    >
                      {project?.name ?? '알 수 없는 프로젝트'}
                    </Link>
                    {project && (
                      <StatusBadge status={project.status} statusMap={PROJECT_STATUS_MAP} />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {completedCount}/{totalCount} 완료
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {progress}%
                  </span>
                </div>
              </div>

              {/* Design steps */}
              <div className="divide-y divide-border">
                {steps.map((step) => {
                  const statusConfig = STEP_STATUS_CONFIG[step.status] ?? STEP_STATUS_CONFIG.PLANNED;
                  return (
                    <div key={step.id} className="flex items-center gap-4 px-4 py-3">
                      {/* Status icon */}
                      <div className="flex-shrink-0">{statusConfig.icon}</div>

                      {/* Process name */}
                      <div className="min-w-[120px]">
                        <p className="text-sm font-medium">{step.process_name}</p>
                      </div>

                      {/* Assignee */}
                      <div className="min-w-[80px]">
                        <p className="text-sm text-muted-foreground">
                          {getAssigneeName(step.assignee_id)}
                        </p>
                      </div>

                      {/* Estimated hours */}
                      <div className="min-w-[70px]">
                        <p className="text-sm text-muted-foreground">
                          {step.estimated_hours ? `${step.estimated_hours}h` : '-'}
                        </p>
                      </div>

                      {/* Date range */}
                      <div className="flex-1 min-w-[140px]">
                        <p className="text-sm text-muted-foreground">
                          {step.start_date
                            ? `${step.start_date} ~ ${step.end_date ?? '진행중'}`
                            : '-'}
                        </p>
                      </div>

                      {/* Status text */}
                      <div className="min-w-[60px] text-right">
                        <span className={`text-sm font-medium ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
