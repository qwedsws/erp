'use client';

import React from 'react';
import { Users } from 'lucide-react';
import type { EngineerWorkload } from '@/hooks/design/useDesignAssignmentsViewModel';

export interface EngineerWorkloadPanelProps {
  engineerWorkloads: EngineerWorkload[];
  maxWorkload: number;
}

export function EngineerWorkloadPanel({
  engineerWorkloads,
  maxWorkload,
}: EngineerWorkloadPanelProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Users size={16} />
        설계자별 업무 배정 현황
      </h3>
      {engineerWorkloads.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          등록된 설계자가 없습니다.
        </p>
      ) : (
        <div className="space-y-3">
          {engineerWorkloads.map((ew) => (
            <div key={ew.engineer.id} className="flex items-center gap-3">
              <span className="text-sm font-medium w-20 shrink-0 truncate">
                {ew.engineer.name}
              </span>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-6 bg-muted rounded overflow-hidden relative">
                  {/* In-progress portion */}
                  {ew.inProgress > 0 && (
                    <div
                      className="absolute top-0 left-0 h-full bg-blue-500 rounded-l"
                      style={{
                        width: `${(ew.inProgress / maxWorkload) * 100}%`,
                      }}
                    />
                  )}
                  {/* Planned portion (stacked after in-progress) */}
                  {ew.planned > 0 && (
                    <div
                      className="absolute top-0 h-full bg-blue-300"
                      style={{
                        left: `${(ew.inProgress / maxWorkload) * 100}%`,
                        width: `${(ew.planned / maxWorkload) * 100}%`,
                      }}
                    />
                  )}
                </div>
                <span className="text-sm text-muted-foreground w-48 shrink-0">
                  {ew.total}건
                  {ew.total > 0 && (
                    <span className="text-xs ml-1">
                      (진행중 {ew.inProgress}, 대기 {ew.planned})
                    </span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
