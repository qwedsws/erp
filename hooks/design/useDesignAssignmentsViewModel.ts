'use client';

import { useState, useMemo, useCallback } from 'react';
import { useProjects } from '@/hooks/projects/useProjects';
import { useProcessSteps } from '@/hooks/projects/useProcessSteps';
import { useProfiles } from '@/hooks/admin/useProfiles';
import type { ProcessStep, ProcessStepStatus, Profile, Project } from '@/domain/shared/entities';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export type StatusFilter = 'ALL' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';

export const STATUS_DOT: Record<ProcessStepStatus, string> = {
  COMPLETED: 'bg-green-500',
  IN_PROGRESS: 'bg-blue-500',
  PLANNED: 'bg-gray-400',
  ON_HOLD: 'bg-yellow-500',
  SKIPPED: 'bg-gray-300',
};

export const STATUS_TEXT: Record<ProcessStepStatus, { label: string; color: string }> = {
  COMPLETED: { label: '완료', color: 'text-green-600' },
  IN_PROGRESS: { label: '진행중', color: 'text-blue-600' },
  PLANNED: { label: '대기', color: 'text-gray-500' },
  ON_HOLD: { label: '보류', color: 'text-yellow-600' },
  SKIPPED: { label: '건너뜀', color: 'text-gray-400' },
};

export const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'PLANNED', label: '대기' },
  { key: 'IN_PROGRESS', label: '진행중' },
  { key: 'COMPLETED', label: '완료' },
];

// ---------------------------------------------------------------------------
// Types returned by the view-model
// ---------------------------------------------------------------------------

export interface AssignmentKpi {
  total: number;
  assigned: number;
  unassigned: number;
  engineerCount: number;
}

export interface EngineerWorkload {
  engineer: Profile;
  total: number;
  inProgress: number;
  planned: number;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDesignAssignmentsViewModel() {
  const { projects } = useProjects();
  const { processSteps, assignProcessSteps } = useProcessSteps();
  const { profiles } = useProfiles();

  // ---- UI state ----
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [batchMode, setBatchMode] = useState(false);
  const [selectedStepIds, setSelectedStepIds] = useState<Set<string>>(new Set());
  const [batchAssigneeId, setBatchAssigneeId] = useState<string>('');

  // ---- Map indexes (O(1) lookups instead of O(n) .find()) ----
  const projectById = useMemo(
    () => new Map<string, Project>(projects.map((p) => [p.id, p])),
    [projects],
  );

  const profileById = useMemo(
    () => new Map<string, Profile>(profiles.map((p) => [p.id, p])),
    [profiles],
  );

  // ---- Derived data ----
  const engineers = useMemo(
    () => profiles.filter((p) => p.role === 'ENGINEER' && p.is_active),
    [profiles],
  );

  const designSteps = useMemo(
    () => processSteps.filter((s) => s.category === 'DESIGN'),
    [processSteps],
  );

  const projectsWithDesign = useMemo(() => {
    const ids = new Set(designSteps.map((s) => s.project_id));
    return projects.filter((p) => ids.has(p.id));
  }, [designSteps, projects]);

  const filteredSteps = useMemo(() => {
    return designSteps
      .filter((s) => {
        if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
        if (projectFilter !== 'ALL' && s.project_id !== projectFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.project_id !== b.project_id) {
          const pA = projectById.get(a.project_id);
          const pB = projectById.get(b.project_id);
          return (pA?.project_no ?? '').localeCompare(pB?.project_no ?? '');
        }
        return a.sequence - b.sequence;
      });
  }, [designSteps, statusFilter, projectFilter, projectById]);

  const unassignedFilteredSteps = useMemo(
    () => filteredSteps.filter((s) => !s.assignee_id),
    [filteredSteps],
  );

  // ---- KPI ----
  const kpi = useMemo<AssignmentKpi>(() => {
    const total = designSteps.length;
    const assigned = designSteps.filter((s) => s.assignee_id).length;
    return { total, assigned, unassigned: total - assigned, engineerCount: engineers.length };
  }, [designSteps, engineers]);

  // ---- Engineer workloads ----
  const engineerWorkloads = useMemo<EngineerWorkload[]>(() => {
    // Build a map assignee_id -> steps for O(n) instead of O(n*m)
    const stepsByAssignee = new Map<string, ProcessStep[]>();
    for (const s of designSteps) {
      if (!s.assignee_id) continue;
      const arr = stepsByAssignee.get(s.assignee_id);
      if (arr) arr.push(s);
      else stepsByAssignee.set(s.assignee_id, [s]);
    }
    return engineers.map((eng) => {
      const assigned = stepsByAssignee.get(eng.id) ?? [];
      const inProgress = assigned.filter((s) => s.status === 'IN_PROGRESS').length;
      const planned = assigned.filter((s) => s.status === 'PLANNED').length;
      return { engineer: eng, total: assigned.length, inProgress, planned };
    });
  }, [engineers, designSteps]);

  const maxWorkload = useMemo(
    () => Math.max(...engineerWorkloads.map((ew) => ew.total), 1),
    [engineerWorkloads],
  );

  // ---- Helpers (O(1) via Map) ----
  const getProjectName = useCallback(
    (projectId: string) => projectById.get(projectId)?.name ?? '알 수 없는 프로젝트',
    [projectById],
  );

  const getAssigneeName = useCallback(
    (assigneeId?: string) => {
      if (!assigneeId) return null;
      return profileById.get(assigneeId)?.name ?? null;
    },
    [profileById],
  );

  // ---- Batch selection helpers ----
  const allUnassignedSelected =
    unassignedFilteredSteps.length > 0 &&
    unassignedFilteredSteps.every((s) => selectedStepIds.has(s.id));

  const handleToggleStep = useCallback((stepId: string) => {
    setSelectedStepIds((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  }, []);

  const handleSelectAllUnassigned = useCallback(() => {
    const allUnassignedIds = unassignedFilteredSteps.map((s) => s.id);
    const allSelected = allUnassignedIds.every((id) => selectedStepIds.has(id));
    if (allSelected) {
      setSelectedStepIds((prev) => {
        const next = new Set(prev);
        allUnassignedIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedStepIds((prev) => {
        const next = new Set(prev);
        allUnassignedIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [unassignedFilteredSteps, selectedStepIds]);

  const handleBatchAssign = useCallback(async () => {
    if (!batchAssigneeId || selectedStepIds.size === 0) return;
    try {
      await assignProcessSteps([...selectedStepIds], batchAssigneeId);
      setSelectedStepIds(new Set());
      setBatchAssigneeId('');
      setBatchMode(false);
    } catch {
      // Prevent unhandled rejection
    }
  }, [batchAssigneeId, selectedStepIds, assignProcessSteps]);

  const handleCancelBatch = useCallback(() => {
    setSelectedStepIds(new Set());
    setBatchAssigneeId('');
    setBatchMode(false);
  }, []);

  const handleSingleAssign = useCallback(
    (stepId: string, assigneeId: string | undefined) => {
      void assignProcessSteps([stepId], assigneeId).catch(() => {
        // Prevent unhandled rejection
      });
    },
    [assignProcessSteps],
  );

  // ---- Filter status label for footer ----
  const activeFilterLabel = useMemo(() => {
    if (statusFilter === 'ALL') return null;
    return FILTER_TABS.find((t) => t.key === statusFilter)?.label ?? null;
  }, [statusFilter]);

  return {
    // State + setters
    statusFilter,
    setStatusFilter,
    projectFilter,
    setProjectFilter,
    batchMode,
    setBatchMode,
    selectedStepIds,
    batchAssigneeId,
    setBatchAssigneeId,

    // Computed
    engineers,
    designSteps,
    projectsWithDesign,
    filteredSteps,
    unassignedFilteredSteps,
    kpi,
    engineerWorkloads,
    maxWorkload,
    allUnassignedSelected,
    activeFilterLabel,

    // Helpers
    getProjectName,
    getAssigneeName,

    // Actions
    handleToggleStep,
    handleSelectAllUnassigned,
    handleBatchAssign,
    handleCancelBatch,
    handleSingleAssign,
  };
}

export type DesignAssignmentsViewModel = ReturnType<typeof useDesignAssignmentsViewModel>;
