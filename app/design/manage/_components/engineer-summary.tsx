'use client';

import React from 'react';
import type { Profile, ProcessStep } from '@/types';

interface EngineerSummaryProps {
  engineers: Profile[];
  allDesignSteps: ProcessStep[];
}

export function EngineerSummary({ engineers, allDesignSteps }: EngineerSummaryProps) {
  if (engineers.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-semibold mb-3">설계자별 공정 배정 현황</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {engineers.map(eng => {
          const assigned = allDesignSteps.filter(s => s.assignee_id === eng.id);
          const engCompleted = assigned.filter(s => s.status === 'COMPLETED').length;
          const engInProgress = assigned.filter(s => s.status === 'IN_PROGRESS').length;
          const engPlanned = assigned.filter(s => s.status === 'PLANNED').length;
          const engHours = assigned.reduce((sum, s) => sum + (s.estimated_hours || 0), 0);
          return (
            <div key={eng.id} className="flex items-center gap-3 p-3 rounded-md border border-border/50 bg-muted/10">
              <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 text-sm font-bold shrink-0">
                {eng.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{eng.name}</p>
                  <span className="text-xs text-muted-foreground">{assigned.length}건 · {engHours}h</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {engCompleted > 0 && <span className="text-xs text-green-600">완료 {engCompleted}</span>}
                  {engInProgress > 0 && <span className="text-xs text-blue-600">진행 {engInProgress}</span>}
                  {engPlanned > 0 && <span className="text-xs text-gray-500">대기 {engPlanned}</span>}
                  {assigned.length === 0 && <span className="text-xs text-muted-foreground">배정 없음</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
