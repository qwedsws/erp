'use client';

import { useMemo } from 'react';
import { useProjects } from '@/hooks/projects/useProjects';
import { useProcessSteps } from '@/hooks/projects/useProcessSteps';
import { useWorkOrders } from '@/hooks/production/useWorkOrders';
import { useWorkLogs } from '@/hooks/production/useWorkLogs';
import { useProfiles } from '@/hooks/admin/useProfiles';
import { useOrders } from '@/hooks/sales/useOrders';
import { useCustomers } from '@/hooks/sales/useCustomers';
import type { Profile, Project, ProcessStep } from '@/domain/shared/entities';
import {
  groupStepsByAssignee,
  groupStepsByProject,
  countStatuses,
  sumEstHours,
  sumCompletedEstHours,
} from './design-workload-helpers';

// ── Return types ──

export interface DesignKpi {
  total: number;
  planned: number;
  inProgress: number;
  completed: number;
  completionRate: number;
  designingProjects: number;
  totalEstHours: number;
  completedEstHours: number;
  unassigned: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface EngineerChartDataPoint {
  name: string;
  /** Korean chart keys for Recharts dataKey */
  '\uC644\uB8CC': number;
  '\uC9C4\uD589\uC911': number;
  '\uB300\uAE30': number;
}

export interface EngineerHoursDataPoint {
  name: string;
  '\uC608\uC0C1\uC2DC\uAC04': number;
  '\uC2E4\uD22C\uC785\uC2DC\uAC04': number;
}

export interface ProjectDesignRow {
  projectId: string;
  projectNo: string;
  projectName: string;
  customerName: string;
  dueDate: string;
  status: string;
  totalSteps: number;
  completed: number;
  inProgress: number;
  totalHours: number;
  completedHours: number;
  progress: number;
  assignees: string[];
}

export interface EngineerProjectDetail {
  project: Project;
  totalForProject: number;
  completedForProject: number;
  progressPercent: number;
}

export interface EngineerWorkload {
  engineer: Profile;
  assignedCount: number;
  assignedProjects: Project[];
  completed: number;
  inProgress: number;
  estHours: number;
  actualHours: number;
  projectDetails: EngineerProjectDetail[];
}

export interface DesignWorkloadStats {
  engineers: Profile[];
  kpi: DesignKpi;
  statusDistribution: ChartDataPoint[];
  codeDistribution: ChartDataPoint[];
  engineerChartData: EngineerChartDataPoint[];
  engineerHoursData: EngineerHoursDataPoint[];
  projectDesignData: ProjectDesignRow[];
  engineerWorkloads: EngineerWorkload[];
}

// ── Hook ──

export function useDesignWorkloadStats(): DesignWorkloadStats {
  const { projects } = useProjects();
  const { processSteps } = useProcessSteps();
  const { workOrders } = useWorkOrders();
  const { workLogs } = useWorkLogs();
  const { profiles } = useProfiles();
  const { orders } = useOrders();
  const { customers } = useCustomers();

  return useMemo(() => {
    // ── Pre-compute lookup maps (eliminate O(n^2) finds) ──
    const projectById = new Map(projects.map(p => [p.id, p]));
    const orderById = new Map(orders.map(o => [o.id, o]));
    const customerById = new Map(customers.map(c => [c.id, c]));
    const profileById = new Map(profiles.map(p => [p.id, p]));

    // ── Filtered base data ──
    const engineers = profiles.filter(p => p.role === 'ENGINEER' && p.is_active);
    const designSteps = processSteps.filter(ps => ps.category === 'DESIGN');

    // ── Grouped indexes ──
    const stepsByAssignee = groupStepsByAssignee(designSteps);
    const stepsByProject = groupStepsByProject(designSteps);

    // ── Work order / work log indexes for actual-hours calc ──
    // Map: processStepId -> workOrderId[]
    const woIdsByStepId = new Map<string, string[]>();
    for (const wo of workOrders) {
      if (!wo.process_step_id) continue;
      const existing = woIdsByStepId.get(wo.process_step_id);
      if (existing) {
        existing.push(wo.id);
      } else {
        woIdsByStepId.set(wo.process_step_id, [wo.id]);
      }
    }

    // Map: workOrderId -> total duration (minutes)
    const durationByWoId = new Map<string, number>();
    for (const wl of workLogs) {
      const current = durationByWoId.get(wl.work_order_id) || 0;
      durationByWoId.set(wl.work_order_id, current + (wl.duration || 0));
    }

    /** Compute actual hours for a set of steps using pre-built indexes. */
    function computeActualHours(steps: ProcessStep[]): number {
      let totalMinutes = 0;
      for (const step of steps) {
        const woIds = woIdsByStepId.get(step.id);
        if (!woIds) continue;
        for (const woId of woIds) {
          totalMinutes += durationByWoId.get(woId) || 0;
        }
      }
      return Math.round((totalMinutes / 60) * 10) / 10;
    }

    // ── KPI (single pass over designSteps) ──
    const totalEstHours = sumEstHours(designSteps);
    const completedEstHours = sumCompletedEstHours(designSteps);
    const { completed: completedCount, inProgress: inProgressCount, planned: plannedCount, total: totalCount } =
      countStatuses(designSteps);

    let unassigned = 0;
    for (const s of designSteps) {
      if (!s.assignee_id) unassigned++;
    }

    const designingProjects = projects.filter(p =>
      p.status === 'DESIGNING' || p.status === 'DESIGN_COMPLETE'
    ).length;

    const kpi: DesignKpi = {
      total: totalCount,
      planned: plannedCount,
      inProgress: inProgressCount,
      completed: completedCount,
      completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      designingProjects,
      totalEstHours,
      completedEstHours,
      unassigned,
    };

    // ── Status distribution (pie chart) ──
    const statusMap: Record<string, { count: number; label: string; color: string }> = {
      COMPLETED: { count: 0, label: '\uC644\uB8CC', color: '#22c55e' },
      IN_PROGRESS: { count: 0, label: '\uC9C4\uD589\uC911', color: '#3b82f6' },
      PLANNED: { count: 0, label: '\uB300\uAE30', color: '#9ca3af' },
      ON_HOLD: { count: 0, label: '\uBCF4\uB958', color: '#f59e0b' },
      SKIPPED: { count: 0, label: '\uAC74\uB108\uB6F0', color: '#f97316' },
    };
    for (const s of designSteps) {
      if (statusMap[s.status]) statusMap[s.status].count++;
    }
    const statusDistribution: ChartDataPoint[] = Object.values(statusMap)
      .filter(d => d.count > 0)
      .map(d => ({ name: d.label, value: d.count, color: d.color }));

    // ── Code distribution (pie chart) ──
    const codeCountMap: Record<string, number> = {};
    for (const s of designSteps) {
      codeCountMap[s.process_name] = (codeCountMap[s.process_name] || 0) + 1;
    }
    const codeDistribution: ChartDataPoint[] = Object.entries(codeCountMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // ── Per-engineer stats (computed once, reused for charts + cards) ──
    const engineerStatsMap = new Map<
      string,
      {
        assigned: ProcessStep[];
        counts: { completed: number; inProgress: number; planned: number; total: number };
        estHours: number;
        actualHours: number;
      }
    >();

    for (const eng of engineers) {
      const assigned = stepsByAssignee.get(eng.id) || [];
      const counts = countStatuses(assigned);
      const estHours = sumEstHours(assigned);
      const actualHours = computeActualHours(assigned);
      engineerStatsMap.set(eng.id, { assigned, counts, estHours, actualHours });
    }

    // ── Engineer chart data (bar chart: status counts) ──
    const engineerChartData: EngineerChartDataPoint[] = engineers.map(eng => {
      const stats = engineerStatsMap.get(eng.id)!;
      return {
        name: eng.name,
        '\uC644\uB8CC': stats.counts.completed,
        '\uC9C4\uD589\uC911': stats.counts.inProgress,
        '\uB300\uAE30': stats.counts.total - stats.counts.completed - stats.counts.inProgress,
      };
    });

    // ── Engineer hours data (bar chart: est vs actual) ──
    const engineerHoursData: EngineerHoursDataPoint[] = engineers.map(eng => {
      const stats = engineerStatsMap.get(eng.id)!;
      return {
        name: eng.name,
        '\uC608\uC0C1\uC2DC\uAC04': stats.estHours,
        '\uC2E4\uD22C\uC785\uC2DC\uAC04': stats.actualHours,
      };
    });

    // ── Project design data (table) ── Uses Map lookups instead of .find() ──
    const projectDesignData: ProjectDesignRow[] = [...stepsByProject.entries()]
      .map(([pid, steps]) => {
        const project = projectById.get(pid);
        const { completed, inProgress, total } = countStatuses(steps);
        const totalHours = sumEstHours(steps);
        const completedHoursForProject = sumCompletedEstHours(steps);
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        const order = project?.order_id ? orderById.get(project.order_id) : undefined;
        const customer = order ? customerById.get(order.customer_id) : undefined;

        const assigneeIds = new Set<string>();
        for (const s of steps) {
          if (s.assignee_id) assigneeIds.add(s.assignee_id);
        }
        const assignees: string[] = [];
        for (const aid of assigneeIds) {
          const name = profileById.get(aid)?.name;
          if (name) assignees.push(name);
        }

        return {
          projectId: pid,
          projectNo: project?.project_no ?? pid,
          projectName: project?.name ?? '\uC54C \uC218 \uC5C6\uC74C',
          customerName: customer?.name ?? '-',
          dueDate: project?.due_date ?? '-',
          status: project?.status ?? '-',
          totalSteps: total,
          completed,
          inProgress,
          totalHours,
          completedHours: completedHoursForProject,
          progress,
          assignees,
        };
      })
      .sort((a, b) => a.progress - b.progress);

    // ── Engineer workloads (detail cards) ──
    const engineerWorkloads: EngineerWorkload[] = engineers.map(engineer => {
      const stats = engineerStatsMap.get(engineer.id)!;
      const { assigned, counts, estHours, actualHours } = stats;

      // Collect unique projects via Map lookup (no .find() in loop)
      const projectIdSet = new Set<string>();
      for (const s of assigned) {
        projectIdSet.add(s.project_id);
      }
      const assignedProjects: Project[] = [];
      for (const pid of projectIdSet) {
        const proj = projectById.get(pid);
        if (proj) assignedProjects.push(proj);
      }

      // Per-project detail: group assigned steps by project
      const stepsByProjForEngineer = new Map<string, ProcessStep[]>();
      for (const s of assigned) {
        const existing = stepsByProjForEngineer.get(s.project_id);
        if (existing) {
          existing.push(s);
        } else {
          stepsByProjForEngineer.set(s.project_id, [s]);
        }
      }

      const projectDetails: EngineerProjectDetail[] = assignedProjects.map(project => {
        const stepsForProject = stepsByProjForEngineer.get(project.id) || [];
        let completedForProject = 0;
        for (const s of stepsForProject) {
          if (s.status === 'COMPLETED') completedForProject++;
        }
        const progressPercent = stepsForProject.length > 0
          ? Math.round((completedForProject / stepsForProject.length) * 100)
          : 0;
        return { project, totalForProject: stepsForProject.length, completedForProject, progressPercent };
      });

      return {
        engineer,
        assignedCount: assigned.length,
        assignedProjects,
        completed: counts.completed,
        inProgress: counts.inProgress,
        estHours,
        actualHours,
        projectDetails,
      };
    });

    return {
      engineers,
      kpi,
      statusDistribution,
      codeDistribution,
      engineerChartData,
      engineerHoursData,
      projectDesignData,
      engineerWorkloads,
    };
  }, [projects, processSteps, workOrders, workLogs, profiles, orders, customers]);
}
