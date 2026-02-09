'use client';

import React from 'react';
import Link from 'next/link';
import type { ProcessStep, Profile } from '@/types';
import { STATUS_DOT, STATUS_TEXT } from '@/hooks/design/useDesignAssignmentsViewModel';

export interface AssignmentsTableProps {
  filteredSteps: ProcessStep[];
  batchMode: boolean;
  selectedStepIds: Set<string>;
  engineers: Profile[];
  activeFilterLabel: string | null;
  getProjectName: (projectId: string) => string;
  getAssigneeName: (assigneeId?: string) => string | null;
  onToggleStep: (stepId: string) => void;
  onSingleAssign: (stepId: string, assigneeId: string | undefined) => void;
}

export function AssignmentsTable({
  filteredSteps,
  batchMode,
  selectedStepIds,
  engineers,
  activeFilterLabel,
  getProjectName,
  getAssigneeName,
  onToggleStep,
  onSingleAssign,
}: AssignmentsTableProps) {
  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              {batchMode && (
                <th className="px-3 py-3 text-center w-10">
                  <span className="sr-only">선택</span>
                </th>
              )}
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">프로젝트</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">공정명</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">상태</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">현재 담당자</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">배정</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">예상시간</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">기간</th>
            </tr>
          </thead>
          <tbody>
            {filteredSteps.map((step) => (
              <AssignmentRow
                key={step.id}
                step={step}
                batchMode={batchMode}
                isSelected={selectedStepIds.has(step.id)}
                engineers={engineers}
                getProjectName={getProjectName}
                getAssigneeName={getAssigneeName}
                onToggleStep={onToggleStep}
                onSingleAssign={onSingleAssign}
              />
            ))}
            {filteredSteps.length === 0 && (
              <tr>
                <td
                  colSpan={batchMode ? 8 : 7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  해당 조건의 설계 공정이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mb-8 text-xs text-muted-foreground">
        총 {filteredSteps.length}건{' '}
        {activeFilterLabel && `(${activeFilterLabel} 필터 적용중)`}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Row sub-component (keeps the table body readable)
// ---------------------------------------------------------------------------

interface AssignmentRowProps {
  step: ProcessStep;
  batchMode: boolean;
  isSelected: boolean;
  engineers: Profile[];
  getProjectName: (projectId: string) => string;
  getAssigneeName: (assigneeId?: string) => string | null;
  onToggleStep: (stepId: string) => void;
  onSingleAssign: (stepId: string, assigneeId: string | undefined) => void;
}

function AssignmentRow({
  step,
  batchMode,
  isSelected,
  engineers,
  getProjectName,
  getAssigneeName,
  onToggleStep,
  onSingleAssign,
}: AssignmentRowProps) {
  const assigneeName = getAssigneeName(step.assignee_id);
  const statusConf = STATUS_TEXT[step.status] ?? STATUS_TEXT.PLANNED;
  const dotColor = STATUS_DOT[step.status] ?? STATUS_DOT.PLANNED;

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30">
      {batchMode && (
        <td className="px-3 py-3 text-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleStep(step.id)}
            className="rounded border-border"
          />
        </td>
      )}
      <td className="px-4 py-3">
        <Link
          href={`/projects/${step.project_id}`}
          className="text-sm font-medium hover:underline text-primary"
        >
          {getProjectName(step.project_id)}
        </Link>
      </td>
      <td className="px-4 py-3 font-medium">{step.process_name}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-1.5">
          <span className={`inline-block h-2 w-2 rounded-full ${dotColor}`} />
          <span className={`text-xs font-medium ${statusConf.color}`}>
            {statusConf.label}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        {assigneeName ? (
          <span className="text-sm">{assigneeName}</span>
        ) : (
          <span className="text-sm text-muted-foreground">미배정</span>
        )}
      </td>
      <td className="px-4 py-3">
        <select
          value={step.assignee_id ?? ''}
          onChange={(e) => onSingleAssign(step.id, e.target.value || undefined)}
          className="text-sm border border-border rounded-md px-2 py-1.5 bg-card focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">미배정</option>
          {engineers.map((eng) => (
            <option key={eng.id} value={eng.id}>
              {eng.name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3 text-right text-muted-foreground">
        {step.estimated_hours ? `${step.estimated_hours}h` : '-'}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {step.start_date
          ? `${step.start_date} ~ ${step.end_date ?? '진행중'}`
          : '-'}
      </td>
    </tr>
  );
}
