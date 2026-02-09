/**
 * Pure calculation engine for project calendar data.
 * No React imports — all functions are pure (data in, data out).
 */

import type {
  Customer,
  Order,
  Priority,
  Project,
  ProjectStatus,
} from '@/domain/shared/entities';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CLOSED_PROJECT_STATUSES: ProjectStatus[] = ['DELIVERED', 'SHIPPED', 'AS_SERVICE'];

// ---------------------------------------------------------------------------
// Exported types (shared with hook & consumers)
// ---------------------------------------------------------------------------

export type StatusFilter = ProjectStatus | 'ALL';
export type EventType = 'start' | 'due' | 'completed';

export interface CalendarEvent {
  projectId: string;
  projectNo: string;
  projectName: string;
  customerName: string;
  status: ProjectStatus;
  priority: Priority;
  type: EventType;
  date: string;
  isOverdueDue: boolean;
}

export interface CalendarDayCell {
  day: number | null;
  dayOfWeekIndex: number;
  dateStr: string | null;
  isWeekend: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasOverdue: boolean;
  events: CalendarEvent[];
  activeProjects: Project[];
}

export interface CalendarMonthStats {
  dueCount: number;
  startCount: number;
  overdueCount: number;
  activeCount: number;
}

export interface DeadlineProjectItem {
  project: Project;
  customerName: string;
  daysLeft: number;
}

export interface OverdueProjectItem {
  project: Project;
  daysOverdue: number;
}

export interface MonthTimelineItem {
  project: Project;
  startDay: number;
  endDay: number;
  leftPct: number;
  widthPct: number;
}

// ---------------------------------------------------------------------------
// Low-level date helpers
// ---------------------------------------------------------------------------

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isSameDay(date1: string, date2: string): boolean {
  return date1 === date2;
}

function isClosedStatus(status: ProjectStatus): boolean {
  return CLOSED_PROJECT_STATUSES.includes(status);
}

// ---------------------------------------------------------------------------
// Lookup-map builders
// ---------------------------------------------------------------------------

export function toOrderMap(orders: Order[]): Map<string, Order> {
  const map = new Map<string, Order>();
  for (const order of orders) {
    map.set(order.id, order);
  }
  return map;
}

export function toCustomerMap(customers: Customer[]): Map<string, Customer> {
  const map = new Map<string, Customer>();
  for (const customer of customers) {
    map.set(customer.id, customer);
  }
  return map;
}

export function toProjectMap(projects: Project[]): Map<string, Project> {
  const map = new Map<string, Project>();
  for (const project of projects) {
    map.set(project.id, project);
  }
  return map;
}

export function buildCustomerNameMap(
  projects: Project[],
  orderById: Map<string, Order>,
  customerById: Map<string, Customer>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const project of projects) {
    const order = project.order_id ? orderById.get(project.order_id) : undefined;
    const customer = order ? customerById.get(order.customer_id) : undefined;
    map.set(project.id, customer?.name ?? '-');
  }
  return map;
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

export function filterProjects(projects: Project[], statusFilter: StatusFilter): Project[] {
  if (statusFilter === 'ALL') return projects;
  return projects.filter((project) => project.status === statusFilter);
}

// ---------------------------------------------------------------------------
// Event computation
// ---------------------------------------------------------------------------

export function computeEvents(
  filteredProjects: Project[],
  customerNameByProjectId: Map<string, string>,
  todayStr: string,
): CalendarEvent[] {
  const result: CalendarEvent[] = [];

  for (const project of filteredProjects) {
    const customerName = customerNameByProjectId.get(project.id) ?? '-';

    if (project.start_date) {
      result.push({
        projectId: project.id,
        projectNo: project.project_no,
        projectName: project.name,
        customerName,
        status: project.status,
        priority: project.priority,
        type: 'start',
        date: project.start_date,
        isOverdueDue: false,
      });
    }

    result.push({
      projectId: project.id,
      projectNo: project.project_no,
      projectName: project.name,
      customerName,
      status: project.status,
      priority: project.priority,
      type: 'due',
      date: project.due_date,
      isOverdueDue: project.due_date < todayStr && !isClosedStatus(project.status),
    });

    if (project.completed_date) {
      result.push({
        projectId: project.id,
        projectNo: project.project_no,
        projectName: project.name,
        customerName,
        status: project.status,
        priority: project.priority,
        type: 'completed',
        date: project.completed_date,
        isOverdueDue: false,
      });
    }
  }

  return result;
}

export function groupEventsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const existing = map.get(event.date);
    if (existing) {
      existing.push(event);
    } else {
      map.set(event.date, [event]);
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Active projects per date (projects whose range spans the date)
// ---------------------------------------------------------------------------

interface ProjectRange {
  projectId: string;
  start: string;
  end: string;
}

export function buildProjectRanges(filteredProjects: Project[]): ProjectRange[] {
  return filteredProjects
    .filter((project) => project.start_date)
    .map((project) => ({
      projectId: project.id,
      start: project.start_date as string,
      end: project.due_date,
    }));
}

export function buildActiveProjectsByDate(
  year: number,
  month: number,
  daysInMonth: number,
  projectRanges: ProjectRange[],
  projectById: Map<string, Project>,
): Map<string, Project[]> {
  const map = new Map<string, Project[]>();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(year, month, day);
    const activeProjects: Project[] = [];

    for (const range of projectRanges) {
      if (dateStr > range.start && dateStr < range.end) {
        const project = projectById.get(range.projectId);
        if (project) {
          activeProjects.push(project);
        }
      }
    }

    if (activeProjects.length > 0) {
      map.set(dateStr, activeProjects);
    }
  }

  return map;
}

// ---------------------------------------------------------------------------
// Calendar grid generation
// ---------------------------------------------------------------------------

export function buildCalendarWeekDays(
  daysInMonth: number,
  firstDayOfWeek: number,
): (number | null)[][] {
  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

export function buildCalendarWeeks(
  weekDays: (number | null)[][],
  year: number,
  month: number,
  eventsByDate: Map<string, CalendarEvent[]>,
  activeProjectsByDate: Map<string, Project[]>,
  todayStr: string,
  selectedDate: string | null,
): CalendarDayCell[][] {
  return weekDays.map((week) =>
    week.map((day, dayOfWeekIndex) => {
      if (day === null) {
        return {
          day: null,
          dayOfWeekIndex,
          dateStr: null,
          isWeekend: dayOfWeekIndex === 0 || dayOfWeekIndex === 6,
          isToday: false,
          isSelected: false,
          hasOverdue: false,
          events: [],
          activeProjects: [],
        } satisfies CalendarDayCell;
      }

      const dateStr = formatDate(year, month, day);
      const dayEvents = eventsByDate.get(dateStr) ?? [];
      const activeProjects = activeProjectsByDate.get(dateStr) ?? [];

      return {
        day,
        dayOfWeekIndex,
        dateStr,
        isWeekend: dayOfWeekIndex === 0 || dayOfWeekIndex === 6,
        isToday: isSameDay(dateStr, todayStr),
        isSelected: selectedDate === dateStr,
        hasOverdue: dayEvents.some((event) => event.isOverdueDue),
        events: dayEvents,
        activeProjects,
      } satisfies CalendarDayCell;
    }),
  );
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export function computeMonthStats(
  filteredProjects: Project[],
  monthStart: string,
  monthEnd: string,
  todayStr: string,
): CalendarMonthStats {
  const dueCount = filteredProjects.filter(
    (project) => project.due_date >= monthStart && project.due_date <= monthEnd,
  ).length;

  const startCount = filteredProjects.filter(
    (project) =>
      project.start_date &&
      project.start_date >= monthStart &&
      project.start_date <= monthEnd,
  ).length;

  const overdueCount = filteredProjects.filter(
    (project) =>
      !isClosedStatus(project.status) &&
      project.due_date >= monthStart &&
      project.due_date <= monthEnd &&
      project.due_date < todayStr,
  ).length;

  const activeCount = filteredProjects.filter(
    (project) => !isClosedStatus(project.status),
  ).length;

  return { dueCount, startCount, overdueCount, activeCount };
}

// ---------------------------------------------------------------------------
// Upcoming deadlines & overdue
// ---------------------------------------------------------------------------

export function computeUpcomingDeadlines(
  filteredProjects: Project[],
  customerNameByProjectId: Map<string, string>,
  todayStr: string,
): DeadlineProjectItem[] {
  const todayDate = new Date(todayStr);
  const thirtyDaysLater = new Date(todayDate);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const endStr = formatDate(
    thirtyDaysLater.getFullYear(),
    thirtyDaysLater.getMonth(),
    thirtyDaysLater.getDate(),
  );

  return filteredProjects
    .filter(
      (project) =>
        !isClosedStatus(project.status) &&
        project.due_date >= todayStr &&
        project.due_date <= endStr,
    )
    .sort((left, right) => left.due_date.localeCompare(right.due_date))
    .map((project) => ({
      project,
      customerName: customerNameByProjectId.get(project.id) ?? '-',
      daysLeft: Math.ceil(
        (new Date(project.due_date).getTime() - new Date(todayStr).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    }));
}

export function computeOverdueProjects(
  filteredProjects: Project[],
  todayStr: string,
): OverdueProjectItem[] {
  return filteredProjects
    .filter((project) => !isClosedStatus(project.status) && project.due_date < todayStr)
    .sort((left, right) => left.due_date.localeCompare(right.due_date))
    .map((project) => ({
      project,
      daysOverdue: Math.ceil(
        (new Date(todayStr).getTime() - new Date(project.due_date).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    }));
}

// ---------------------------------------------------------------------------
// Monthly timeline items
// ---------------------------------------------------------------------------

export function computeMonthTimelineItems(
  filteredProjects: Project[],
  monthStart: string,
  monthEnd: string,
  daysInMonth: number,
): MonthTimelineItem[] {
  return filteredProjects
    .filter(
      (project) =>
        (project.start_date && project.start_date <= monthEnd && project.due_date >= monthStart) ||
        (!project.start_date && project.due_date >= monthStart && project.due_date <= monthEnd),
    )
    .sort((left, right) =>
      (left.start_date ?? left.due_date).localeCompare(right.start_date ?? right.due_date),
    )
    .map((project) => {
      const startDay = project.start_date
        ? Math.max(
            1,
            project.start_date >= monthStart
              ? Number.parseInt(project.start_date.split('-')[2], 10)
              : 1,
          )
        : Number.parseInt(project.due_date.split('-')[2], 10);
      const endDay =
        project.due_date <= monthEnd
          ? Number.parseInt(project.due_date.split('-')[2], 10)
          : daysInMonth;

      return {
        project,
        startDay,
        endDay,
        leftPct: ((startDay - 1) / daysInMonth) * 100,
        widthPct: Math.max(((endDay - startDay + 1) / daysInMonth) * 100, 3),
      };
    });
}
