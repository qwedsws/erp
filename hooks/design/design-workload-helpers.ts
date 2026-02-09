import type { ProcessStep } from '@/domain/shared/entities';

// ── Internal helpers (pure functions, no hooks) ──

export interface StepStatusCounts {
  completed: number;
  inProgress: number;
  planned: number;
  total: number;
}

/** Group design steps by assignee_id into a Map for O(1) lookup. */
export function groupStepsByAssignee(designSteps: ProcessStep[]): Map<string, ProcessStep[]> {
  const map = new Map<string, ProcessStep[]>();
  for (const step of designSteps) {
    if (!step.assignee_id) continue;
    const existing = map.get(step.assignee_id);
    if (existing) {
      existing.push(step);
    } else {
      map.set(step.assignee_id, [step]);
    }
  }
  return map;
}

/** Group design steps by project_id into a Map. */
export function groupStepsByProject(designSteps: ProcessStep[]): Map<string, ProcessStep[]> {
  const map = new Map<string, ProcessStep[]>();
  for (const step of designSteps) {
    const existing = map.get(step.project_id);
    if (existing) {
      existing.push(step);
    } else {
      map.set(step.project_id, [step]);
    }
  }
  return map;
}

/** Count completed / inProgress / planned from a list of steps. */
export function countStatuses(steps: ProcessStep[]): StepStatusCounts {
  let completed = 0;
  let inProgress = 0;
  let planned = 0;
  for (const s of steps) {
    if (s.status === 'COMPLETED') completed++;
    else if (s.status === 'IN_PROGRESS') inProgress++;
    else if (s.status === 'PLANNED') planned++;
  }
  return { completed, inProgress, planned, total: steps.length };
}

/** Sum estimated_hours from a list of steps. */
export function sumEstHours(steps: ProcessStep[]): number {
  let sum = 0;
  for (const s of steps) {
    sum += s.estimated_hours || 0;
  }
  return sum;
}

/** Sum estimated_hours from completed steps only. */
export function sumCompletedEstHours(steps: ProcessStep[]): number {
  let sum = 0;
  for (const s of steps) {
    if (s.status === 'COMPLETED') sum += s.estimated_hours || 0;
  }
  return sum;
}
