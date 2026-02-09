'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { StatusBadge } from '@/components/common/status-badge';
import { PROJECT_STATUS_MAP } from '@/types';
import type {
  DeadlineProjectItem,
  OverdueProjectItem,
} from '@/hooks/projects/useProjectCalendarData';

interface DeadlinesPanelProps {
  overdueProjects: OverdueProjectItem[];
  upcomingDeadlines: DeadlineProjectItem[];
}

export function DeadlinesPanel({
  overdueProjects,
  upcomingDeadlines,
}: DeadlinesPanelProps) {
  return (
    <>
      {overdueProjects.length > 0 && (
        <OverdueSection overdueProjects={overdueProjects} />
      )}
      <UpcomingSection upcomingDeadlines={upcomingDeadlines} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Overdue projects section                                           */
/* ------------------------------------------------------------------ */

interface OverdueSectionProps {
  overdueProjects: OverdueProjectItem[];
}

function OverdueSection({ overdueProjects }: OverdueSectionProps) {
  return (
    <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <h3 className="font-semibold text-sm text-red-700 dark:text-red-400">
          납기 지연 ({overdueProjects.length})
        </h3>
      </div>
      <div className="space-y-2">
        {overdueProjects.map(({ project, daysOverdue }) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="block p-2 rounded-md bg-white dark:bg-card border border-red-200 dark:border-red-800 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{project.name}</span>
              <span className="text-xs text-red-600 font-bold">D+{daysOverdue}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {project.project_no} · 납기: {project.due_date}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Upcoming deadlines section                                         */
/* ------------------------------------------------------------------ */

interface UpcomingSectionProps {
  upcomingDeadlines: DeadlineProjectItem[];
}

function UpcomingSection({ upcomingDeadlines }: UpcomingSectionProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold text-sm mb-3">
        다가오는 납기 ({upcomingDeadlines.length})
      </h3>
      {upcomingDeadlines.length === 0 ? (
        <p className="text-sm text-muted-foreground">30일 내 납기 예정이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {upcomingDeadlines.map(({ project, customerName, daysLeft }) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block p-2 rounded-md border border-border hover:bg-accent transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">{project.name}</span>
                <span
                  className={`text-xs font-bold shrink-0 ml-2 ${
                    daysLeft <= 7
                      ? 'text-red-500'
                      : daysLeft <= 14
                        ? 'text-orange-500'
                        : 'text-muted-foreground'
                  }`}
                >
                  D-{daysLeft}
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xs text-muted-foreground">
                  {project.project_no} · {customerName}
                </p>
                <StatusBadge status={project.status} statusMap={PROJECT_STATUS_MAP} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
