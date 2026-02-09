'use client';

import React from 'react';
import { PROCESS_CATEGORY_MAP } from '@/types';
import type { ProcessStep, Profile } from '@/types';
import { STEP_STATUS_ICON } from './step-status-icon';

interface ProjectProcessesTabProps {
  steps: ProcessStep[];
  profileById: Map<string, Profile>;
}

export function ProjectProcessesTab({ steps, profileById }: ProjectProcessesTabProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="font-semibold mb-4">공정 현황</h3>
      {steps.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">등록된 공정이 없습니다.</p>
      ) : (
        <div className="space-y-1">
          {steps.map((step, idx) => {
            const assignee = step.assignee_id ? profileById.get(step.assignee_id) : null;
            return (
              <div key={step.id} className={`flex items-center gap-4 p-3 rounded-md ${step.status === 'IN_PROGRESS' ? 'bg-blue-50' : ''}`}>
                <div className="flex items-center gap-2 w-6">{STEP_STATUS_ICON[step.status]}</div>
                <span className="text-xs text-muted-foreground w-6">{idx + 1}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-muted">{PROCESS_CATEGORY_MAP[step.category]}</span>
                <span className="font-medium text-sm flex-1">{step.process_name}</span>
                <span className="text-xs text-muted-foreground">{assignee?.name || '-'}</span>
                <span className="text-xs text-muted-foreground w-16 text-right">{step.estimated_hours ? `${step.estimated_hours}h` : '-'}</span>
                <span className="text-xs text-muted-foreground w-24 text-right">
                  {step.start_date || '-'} {step.end_date ? `~ ${step.end_date}` : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
