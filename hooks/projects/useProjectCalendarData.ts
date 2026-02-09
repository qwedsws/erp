'use client';

import { useMemo, useState } from 'react';
import { useProjects } from '@/hooks/projects/useProjects';
import { useCustomers } from '@/hooks/sales/useCustomers';
import { useOrders } from '@/hooks/sales/useOrders';
import type { Project } from '@/domain/shared/entities';
import {
  buildActiveProjectsByDate,
  buildCalendarWeekDays,
  buildCalendarWeeks,
  buildCustomerNameMap,
  buildProjectRanges,
  computeEvents,
  computeMonthStats,
  computeMonthTimelineItems,
  computeOverdueProjects,
  computeUpcomingDeadlines,
  filterProjects,
  formatDate,
  getDaysInMonth,
  getFirstDayOfWeek,
  groupEventsByDate,
  toCustomerMap,
  toOrderMap,
  toProjectMap,
} from './calendar-engine';
import type {
  CalendarDayCell,
  CalendarEvent,
  CalendarMonthStats,
  DeadlineProjectItem,
  MonthTimelineItem,
  OverdueProjectItem,
  StatusFilter,
} from './calendar-engine';

// Re-export all types so existing consumers keep working via the same import path.
export type {
  StatusFilter,
  EventType,
  CalendarEvent,
  CalendarDayCell,
  CalendarMonthStats,
  DeadlineProjectItem,
  OverdueProjectItem,
  MonthTimelineItem,
} from './calendar-engine';

export interface ProjectCalendarData {
  currentYear: number;
  currentMonth: number;
  todayStr: string;
  monthLabel: string;
  daysInMonth: number;
  timelineMidDay: number;
  statusFilter: StatusFilter;
  selectedDate: string | null;
  monthStats: CalendarMonthStats;
  calendarWeeks: CalendarDayCell[][];
  selectedDateEvents: CalendarEvent[];
  selectedDateActiveProjects: Project[];
  overdueProjects: OverdueProjectItem[];
  upcomingDeadlines: DeadlineProjectItem[];
  monthTimelineItems: MonthTimelineItem[];
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
  setStatusFilter: (filter: StatusFilter) => void;
  toggleDateSelection: (dateStr: string) => void;
}

export function useProjectCalendarData(): ProjectCalendarData {
  const { projects } = useProjects();
  const { customers } = useCustomers();
  const { orders } = useOrders();

  // ---- state ----
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // ---- derived scalars ----
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());
  const monthLabel = `${currentYear}년 ${currentMonth + 1}월`;
  const daysInMonth = useMemo(() => getDaysInMonth(currentYear, currentMonth), [currentYear, currentMonth]);
  const firstDayOfWeek = useMemo(() => getFirstDayOfWeek(currentYear, currentMonth), [currentYear, currentMonth]);
  const monthStart = useMemo(() => formatDate(currentYear, currentMonth, 1), [currentYear, currentMonth]);
  const monthEnd = useMemo(() => formatDate(currentYear, currentMonth, daysInMonth), [currentYear, currentMonth, daysInMonth]);

  // ---- lookup maps ----
  const orderById = useMemo(() => toOrderMap(orders), [orders]);
  const customerById = useMemo(() => toCustomerMap(customers), [customers]);
  const customerNameByProjectId = useMemo(
    () => buildCustomerNameMap(projects, orderById, customerById),
    [projects, orderById, customerById],
  );
  const projectById = useMemo(() => toProjectMap(projects), [projects]);

  // ---- filtered projects + events ----
  const filteredProjects = useMemo(
    () => filterProjects(projects, statusFilter),
    [projects, statusFilter],
  );
  const events = useMemo(
    () => computeEvents(filteredProjects, customerNameByProjectId, todayStr),
    [filteredProjects, customerNameByProjectId, todayStr],
  );
  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);

  // ---- active projects per date ----
  const projectRanges = useMemo(() => buildProjectRanges(filteredProjects), [filteredProjects]);
  const activeProjectsByDate = useMemo(
    () => buildActiveProjectsByDate(currentYear, currentMonth, daysInMonth, projectRanges, projectById),
    [currentYear, currentMonth, daysInMonth, projectRanges, projectById],
  );

  // ---- calendar grid ----
  const calendarWeekDays = useMemo(
    () => buildCalendarWeekDays(daysInMonth, firstDayOfWeek),
    [daysInMonth, firstDayOfWeek],
  );
  const calendarWeeks = useMemo(
    () => buildCalendarWeeks(calendarWeekDays, currentYear, currentMonth, eventsByDate, activeProjectsByDate, todayStr, selectedDate),
    [calendarWeekDays, currentYear, currentMonth, eventsByDate, activeProjectsByDate, todayStr, selectedDate],
  );

  // ---- selected date data ----
  const selectedDateEvents = useMemo(
    () => (selectedDate ? eventsByDate.get(selectedDate) ?? [] : []),
    [eventsByDate, selectedDate],
  );
  const selectedDateActiveProjects = useMemo(
    () => (selectedDate ? activeProjectsByDate.get(selectedDate) ?? [] : []),
    [activeProjectsByDate, selectedDate],
  );

  // ---- stats & lists (delegated to pure engine functions) ----
  const monthStats = useMemo(
    () => computeMonthStats(filteredProjects, monthStart, monthEnd, todayStr),
    [filteredProjects, monthStart, monthEnd, todayStr],
  );
  const upcomingDeadlines = useMemo(
    () => computeUpcomingDeadlines(filteredProjects, customerNameByProjectId, todayStr),
    [filteredProjects, customerNameByProjectId, todayStr],
  );
  const overdueProjects = useMemo(
    () => computeOverdueProjects(filteredProjects, todayStr),
    [filteredProjects, todayStr],
  );
  const monthTimelineItems = useMemo(
    () => computeMonthTimelineItems(filteredProjects, monthStart, monthEnd, daysInMonth),
    [filteredProjects, monthStart, monthEnd, daysInMonth],
  );

  // ---- navigation callbacks ----
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((year) => year - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((month) => month - 1);
    }
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((year) => year + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((month) => month + 1);
    }
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(todayStr);
  };

  const toggleDateSelection = (dateStr: string) => {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
  };

  return {
    currentYear,
    currentMonth,
    todayStr,
    monthLabel,
    daysInMonth,
    timelineMidDay: Math.floor(daysInMonth / 2),
    statusFilter,
    selectedDate,
    monthStats,
    calendarWeeks,
    selectedDateEvents,
    selectedDateActiveProjects,
    overdueProjects,
    upcomingDeadlines,
    monthTimelineItems,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    setStatusFilter,
    toggleDateSelection,
  };
}
