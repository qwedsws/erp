'use client';

import { PROJECT_STATUS_MAP } from '@/types';
import type {
  ProjectCalendarData,
  StatusFilter,
} from '@/hooks/projects/useProjectCalendarData';

import { CalendarGrid } from './calendar-grid';
import { SelectedDatePanel } from './selected-date-panel';
import { DeadlinesPanel } from './deadlines-panel';
import { TimelinePanel } from './timeline-panel';

const STATUS_FILTER_OPTIONS = [
  'ALL',
  'CONFIRMED',
  'DESIGNING',
  'MACHINING',
  'ASSEMBLING',
  'TRYOUT',
  'DELIVERED',
] as const;

interface ProjectCalendarViewProps {
  data: ProjectCalendarData;
}

export function ProjectCalendarView({ data }: ProjectCalendarViewProps) {
  return (
    <>
      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">이번 달 납기</p>
          <p className="text-2xl font-bold mt-1">{data.monthStats.dueCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">이번 달 시작</p>
          <p className="text-2xl font-bold mt-1">{data.monthStats.startCount}</p>
        </div>
        <div
          className={`rounded-lg border p-4 ${
            data.monthStats.overdueCount > 0
              ? 'border-red-400 bg-red-50 dark:bg-red-950'
              : 'border-border bg-card'
          }`}
        >
          <p className="text-sm text-muted-foreground">납기 지연</p>
          <p
            className={`text-2xl font-bold mt-1 ${
              data.monthStats.overdueCount > 0 ? 'text-red-600' : ''
            }`}
          >
            {data.monthStats.overdueCount}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">진행중 프로젝트</p>
          <p className="text-2xl font-bold mt-1">{data.monthStats.activeCount}</p>
        </div>
      </div>

      {/* Status filter buttons */}
      <div className="flex items-center gap-1 mb-4 flex-wrap">
        {STATUS_FILTER_OPTIONS.map((status) => (
          <button
            key={status}
            onClick={() => data.setStatusFilter(status as StatusFilter)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              data.statusFilter === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {status === 'ALL' ? '전체' : PROJECT_STATUS_MAP[status]?.label || status}
          </button>
        ))}
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <CalendarGrid
          monthLabel={data.monthLabel}
          calendarWeeks={data.calendarWeeks}
          goToPrevMonth={data.goToPrevMonth}
          goToNextMonth={data.goToNextMonth}
          goToToday={data.goToToday}
          toggleDateSelection={data.toggleDateSelection}
        />

        <div className="space-y-4">
          {data.selectedDate && (
            <SelectedDatePanel
              selectedDate={data.selectedDate}
              events={data.selectedDateEvents}
              activeProjects={data.selectedDateActiveProjects}
            />
          )}

          <DeadlinesPanel
            overdueProjects={data.overdueProjects}
            upcomingDeadlines={data.upcomingDeadlines}
          />

          <TimelinePanel
            monthTimelineItems={data.monthTimelineItems}
            timelineMidDay={data.timelineMidDay}
            daysInMonth={data.daysInMonth}
          />
        </div>
      </div>
    </>
  );
}
