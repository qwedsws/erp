'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Play,
} from 'lucide-react';
import type {
  CalendarDayCell,
  CalendarEvent,
  EventType,
} from '@/hooks/projects/useProjectCalendarData';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const EVENT_ICON: Record<EventType, ReactNode> = {
  start: <Play className="h-3 w-3 text-blue-600 shrink-0" />,
  due: <Flag className="h-3 w-3 text-red-500 shrink-0" />,
  completed: <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />,
};

interface CalendarGridProps {
  monthLabel: string;
  calendarWeeks: CalendarDayCell[][];
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
  toggleDateSelection: (dateStr: string) => void;
}

export function CalendarGrid({
  monthLabel,
  calendarWeeks,
  goToPrevMonth,
  goToNextMonth,
  goToToday,
  toggleDateSelection,
}: CalendarGridProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header with month navigation */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={goToPrevMonth}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-lg font-semibold min-w-[140px] text-center">
            {monthLabel}
          </h2>
          <button
            onClick={goToNextMonth}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <button
          onClick={goToToday}
          className="px-3 py-1.5 text-sm rounded-md border border-input hover:bg-accent"
        >
          오늘
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((day, index) => (
          <div
            key={day}
            className={`py-2 text-center text-xs font-medium ${
              index === 0
                ? 'text-red-500'
                : index === 6
                  ? 'text-blue-500'
                  : 'text-muted-foreground'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="divide-y divide-border">
        {calendarWeeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 divide-x divide-border">
            {week.map((dayCell, dayIndex) => {
              if (dayCell.day === null || dayCell.dateStr === null) {
                return (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className="min-h-[100px] bg-muted/20 p-1"
                  />
                );
              }

              return (
                <DayCell
                  key={`${weekIndex}-${dayCell.dateStr}`}
                  dayCell={dayCell}
                  onSelect={() => toggleDateSelection(dayCell.dateStr as string)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 p-3 border-t border-border text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Play className="h-3 w-3 text-blue-600" /> 시작일
        </span>
        <span className="flex items-center gap-1">
          <Flag className="h-3 w-3 text-red-500" /> 납기일
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-500" /> 완료일
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-50 border border-blue-200" />
          진행중 기간
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Internal DayCell sub-component                                     */
/* ------------------------------------------------------------------ */

interface DayCellProps {
  dayCell: CalendarDayCell;
  onSelect: () => void;
}

function DayCell({ dayCell, onSelect }: DayCellProps) {
  return (
    <div
      onClick={onSelect}
      className={`min-h-[100px] p-1 cursor-pointer transition-colors ${
        dayCell.isSelected
          ? 'bg-primary/5 ring-1 ring-primary ring-inset'
          : 'hover:bg-accent/50'
      } ${
        dayCell.activeProjects.length > 0
          ? 'bg-blue-50/30 dark:bg-blue-950/10'
          : ''
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-xs leading-6 w-6 h-6 flex items-center justify-center rounded-full ${
            dayCell.isToday
              ? 'bg-primary text-primary-foreground font-bold'
              : dayCell.hasOverdue
                ? 'text-red-600 font-bold'
                : dayCell.isWeekend
                  ? dayCell.dayOfWeekIndex === 0
                    ? 'text-red-400'
                    : 'text-blue-400'
                  : 'text-foreground'
          }`}
        >
          {dayCell.day}
        </span>
        {dayCell.activeProjects.length > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {dayCell.activeProjects.length}건 진행
          </span>
        )}
      </div>

      <div className="space-y-0.5">
        {dayCell.events.slice(0, 3).map((event, eventIndex) => (
          <EventPill
            key={`${event.projectId}-${event.type}-${eventIndex}`}
            event={event}
          />
        ))}
        {dayCell.events.length > 3 && (
          <span className="block text-[10px] text-muted-foreground pl-1">
            +{dayCell.events.length - 3}건 더
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Internal EventPill sub-component                                   */
/* ------------------------------------------------------------------ */

interface EventPillProps {
  event: CalendarEvent;
}

function EventPill({ event }: EventPillProps) {
  return (
    <Link
      href={`/projects/${event.projectId}`}
      onClick={(e) => e.stopPropagation()}
      className={`flex items-center gap-1 px-1 py-0.5 rounded text-[10px] leading-tight truncate transition-colors ${
        event.type === 'due'
          ? event.isOverdueDue
            ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400'
          : event.type === 'start'
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
            : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
      }`}
    >
      {EVENT_ICON[event.type]}
      <span className="truncate">{event.projectName}</span>
    </Link>
  );
}
