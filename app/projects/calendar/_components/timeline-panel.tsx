'use client';

import Link from 'next/link';
import { MOLD_TYPE_MAP } from '@/types';
import type { MonthTimelineItem } from '@/hooks/projects/useProjectCalendarData';

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-gray-400',
  DESIGNING: 'bg-blue-500',
  DESIGN_COMPLETE: 'bg-blue-400',
  MATERIAL_PREP: 'bg-yellow-500',
  MACHINING: 'bg-orange-500',
  ASSEMBLING: 'bg-orange-400',
  TRYOUT: 'bg-purple-500',
  REWORK: 'bg-red-500',
  FINAL_INSPECTION: 'bg-purple-400',
  READY_TO_SHIP: 'bg-green-400',
  SHIPPED: 'bg-green-500',
  DELIVERED: 'bg-green-600',
  AS_SERVICE: 'bg-gray-400',
};

interface TimelinePanelProps {
  monthTimelineItems: MonthTimelineItem[];
  timelineMidDay: number;
  daysInMonth: number;
}

export function TimelinePanel({
  monthTimelineItems,
  timelineMidDay,
  daysInMonth,
}: TimelinePanelProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold text-sm mb-3">이번 달 프로젝트 기간</h3>
      {monthTimelineItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">이번 달에 해당하는 프로젝트가 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {monthTimelineItems.map(({ project, leftPct, widthPct }) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="block group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                  {project.name}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                  {MOLD_TYPE_MAP[project.mold_type] ?? project.mold_type}
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full relative overflow-hidden">
                <div
                  className={`absolute top-0 h-full rounded-full ${
                    STATUS_COLORS[project.status] ?? 'bg-gray-400'
                  } opacity-70 group-hover:opacity-100 transition-opacity`}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                />
              </div>
            </Link>
          ))}
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>1일</span>
            <span>{timelineMidDay}일</span>
            <span>{daysInMonth}일</span>
          </div>
        </div>
      )}
    </div>
  );
}
