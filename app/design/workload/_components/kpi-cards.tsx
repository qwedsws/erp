'use client';

import React from 'react';
import {
  Users,
  FolderKanban,
  Clock,
  ListChecks,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import type { DesignKpi } from '@/hooks/design/useDesignWorkloadStats';

interface KpiCardsProps {
  kpi: DesignKpi;
  engineerCount: number;
}

export function KpiCards({ kpi, engineerCount }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground">설계 프로젝트</p>
          <FolderKanban className="h-4 w-4 text-blue-500" />
        </div>
        <p className="text-2xl font-bold">{kpi.designingProjects}</p>
        <p className="text-xs text-muted-foreground mt-0.5">DESIGNING / COMPLETE</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground">전체 공정</p>
          <ListChecks className="h-4 w-4 text-blue-500" />
        </div>
        <p className="text-2xl font-bold">{kpi.total}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          대기 {kpi.planned} · 진행 {kpi.inProgress} · 완료 {kpi.completed}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground">완료율</p>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </div>
        <p className="text-2xl font-bold text-green-600">{kpi.completionRate}%</p>
        <p className="text-xs text-muted-foreground mt-0.5">{kpi.completed}/{kpi.total} 완료</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground">총 예상시간</p>
          <Clock className="h-4 w-4 text-purple-500" />
        </div>
        <p className="text-2xl font-bold">{kpi.totalEstHours}<span className="text-sm font-normal text-muted-foreground">h</span></p>
        <p className="text-xs text-muted-foreground mt-0.5">완료 {kpi.completedEstHours}h</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground">설계자</p>
          <Users className="h-4 w-4 text-blue-500" />
        </div>
        <p className="text-2xl font-bold">{engineerCount}<span className="text-sm font-normal text-muted-foreground">명</span></p>
        <p className="text-xs text-muted-foreground mt-0.5">활성 ENGINEER</p>
      </div>
      <div className={`rounded-lg border p-4 ${kpi.unassigned > 0 ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' : 'border-border bg-card'}`}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground">미배정</p>
          <AlertTriangle className={`h-4 w-4 ${kpi.unassigned > 0 ? 'text-yellow-500' : 'text-gray-400'}`} />
        </div>
        <p className={`text-2xl font-bold ${kpi.unassigned > 0 ? 'text-yellow-600' : ''}`}>{kpi.unassigned}</p>
        <p className="text-xs text-muted-foreground mt-0.5">담당자 미배정 공정</p>
      </div>
    </div>
  );
}
