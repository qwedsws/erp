'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/common/status-badge';
import { PROJECT_STATUS_MAP } from '@/types';
import {
  CheckCircle2,
  Flag,
  Play,
} from 'lucide-react';
import type {
  CalendarEvent,
  EventType,
} from '@/hooks/projects/useProjectCalendarData';

interface ActiveProjectView {
  id: string;
  name: string;
  status: string;
}

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

const EVENT_ICON: Record<EventType, ReactNode> = {
  start: <Play className="h-3 w-3 text-blue-600 shrink-0" />,
  due: <Flag className="h-3 w-3 text-red-500 shrink-0" />,
  completed: <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />,
};

const EVENT_LABEL: Record<EventType, string> = {
  start: '시작',
  due: '납기',
  completed: '완료',
};

interface SelectedDatePanelProps {
  selectedDate: string;
  events: CalendarEvent[];
  activeProjects: ActiveProjectView[];
}

export function SelectedDatePanel({
  selectedDate,
  events,
  activeProjects,
}: SelectedDatePanelProps) {
  const isEmpty = events.length === 0 && activeProjects.length === 0;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold text-sm mb-3">
        {selectedDate.replace(/-/g, '.')} 상세
      </h3>

      {isEmpty ? (
        <p className="text-sm text-muted-foreground">해당 일자에 일정이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {events.map((event, index) => (
            <Link
              key={`${event.projectId}-${event.type}-${index}`}
              href={`/projects/${event.projectId}`}
              className="block p-2 rounded-md border border-border hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                {EVENT_ICON[event.type]}
                <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-muted">
                  {EVENT_LABEL[event.type]}
                </span>
                <StatusBadge status={event.status} statusMap={PROJECT_STATUS_MAP} />
              </div>
              <p className="text-sm font-medium">{event.projectName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {event.projectNo} · {event.customerName}
              </p>
            </Link>
          ))}

          {activeProjects.length > 0 && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">진행중인 프로젝트</p>
              {activeProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent text-sm"
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      STATUS_COLORS[project.status] ?? 'bg-gray-400'
                    }`}
                  />
                  <span className="truncate">{project.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
