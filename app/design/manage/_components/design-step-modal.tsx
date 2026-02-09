'use client';

import React from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/common/status-badge';
import { PROJECT_STATUS_MAP, PRIORITY_MAP, MOLD_TYPE_MAP } from '@/types';
import type { Project, ProcessStep, MoldType } from '@/types';
import {
  DESIGN_PROCESS_OPTIONS,
  STEP_STATUS_CONFIG,
  type AddForm,
} from '@/hooks/design/useDesignManageViewModel';
import {
  Plus,
  Trash2,
  X,
  ListChecks,
  Calendar,
  User,
  Hash,
  ExternalLink,
} from 'lucide-react';

interface DesignStepModalProps {
  selectedProjectId: string;
  selectedProject: Project;
  modalSteps: ProcessStep[];
  addForm: AddForm;
  setAddForm: React.Dispatch<React.SetStateAction<AddForm>>;
  getAssigneeName: (assigneeId?: string) => string | null;
  getCustomerName: (project: Project) => string | null;
  getDaysRemaining: (dueDate: string) => number;
  onClose: () => void;
  onAdd: () => void;
  onDeleteStep: (stepId: string) => void;
}

export function DesignStepModal({
  selectedProjectId,
  selectedProject,
  modalSteps,
  addForm,
  setAddForm,
  getAssigneeName,
  getCustomerName,
  getDaysRemaining,
  onClose,
  onAdd,
  onDeleteStep,
}: DesignStepModalProps) {
  const customerName = getCustomerName(selectedProject);
  const daysRemaining = getDaysRemaining(selectedProject.due_date);
  const completedCount = modalSteps.filter(s => s.status === 'COMPLETED').length;
  const progress = modalSteps.length > 0 ? Math.round((completedCount / modalSteps.length) * 100) : 0;
  const totalHours = modalSteps.reduce((sum, s) => sum + (s.estimated_hours || 0), 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal */}
      <div
        className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground font-mono">{selectedProject.project_no}</span>
                <StatusBadge status={selectedProject.status} statusMap={PROJECT_STATUS_MAP} />
                <StatusBadge status={selectedProject.priority} statusMap={PRIORITY_MAP} />
              </div>
              <h2 className="text-lg font-semibold">{selectedProject.name}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                {customerName && (
                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{customerName}</span>
                )}
                <span className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {MOLD_TYPE_MAP[selectedProject.mold_type as MoldType] ?? selectedProject.mold_type}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  납기 {selectedProject.due_date}
                  {daysRemaining <= 0 ? (
                    <span className="text-red-500 font-medium ml-1">({Math.abs(daysRemaining)}일 초과)</span>
                  ) : daysRemaining <= 14 ? (
                    <span className="text-yellow-600 font-medium ml-1">(D-{daysRemaining})</span>
                  ) : (
                    <span className="ml-1">(D-{daysRemaining})</span>
                  )}
                </span>
                <Link
                  href={`/projects/${selectedProjectId}`}
                  className="flex items-center gap-1 text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  프로젝트 상세
                </Link>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent shrink-0 ml-4"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress in header */}
          {modalSteps.length > 0 && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {completedCount}/{modalSteps.length} 완료
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {totalHours}h
              </span>
            </div>
          )}
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {modalSteps.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <ListChecks className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">등록된 설계 공정이 없습니다</p>
              <p className="text-xs text-muted-foreground mt-1">아래에서 공정을 추가하세요</p>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div className="grid grid-cols-[36px_1fr_100px_80px_90px_80px_40px] items-center px-6 py-2 text-xs font-medium text-muted-foreground bg-muted/30 border-b border-border sticky top-0 z-10">
                <span className="text-center">#</span>
                <span>공정명</span>
                <span>담당자</span>
                <span className="text-right">예상시간</span>
                <span className="text-center">기간</span>
                <span className="text-center">상태</span>
                <span />
              </div>
              {/* Step rows */}
              {modalSteps.map((step, idx) => {
                const statusCfg = STEP_STATUS_CONFIG[step.status] ?? STEP_STATUS_CONFIG.PLANNED;
                const assigneeName = getAssigneeName(step.assignee_id);
                return (
                  <div
                    key={step.id}
                    className={`grid grid-cols-[36px_1fr_100px_80px_90px_80px_40px] items-center px-6 py-3 text-sm ${
                      idx < modalSteps.length - 1 ? 'border-b border-border/50' : ''
                    } ${step.status === 'COMPLETED' ? 'opacity-50' : ''}`}
                  >
                    <span className="text-center text-xs text-muted-foreground font-mono">{step.sequence}</span>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{step.process_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{step.process_code}</p>
                    </div>
                    <span className={`text-xs ${assigneeName ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {assigneeName ?? '미배정'}
                    </span>
                    <span className="text-right tabular-nums text-xs">
                      {step.estimated_hours ? `${step.estimated_hours}h` : '-'}
                    </span>
                    <span className="text-center text-xs text-muted-foreground">
                      {step.start_date
                        ? step.end_date
                          ? `${step.start_date.slice(5)}~${step.end_date.slice(5)}`
                          : `${step.start_date.slice(5)}~`
                        : '-'}
                    </span>
                    <div className="flex justify-center">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.color} ${statusCfg.bg}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="flex justify-center">
                      {step.status === 'PLANNED' ? (
                        <button
                          onClick={() => onDeleteStep(step.id)}
                          className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <span className="w-[22px]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer - Add Form */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 shrink-0">
          <p className="text-xs font-medium text-muted-foreground mb-2">설계 공정 추가</p>
          <div className="flex items-center gap-3">
            <select
              value={addForm.code}
              onChange={(e) => setAddForm(prev => ({ ...prev, code: e.target.value }))}
              className="text-sm border border-border rounded-md px-2.5 py-2 bg-card focus:outline-none focus:ring-1 focus:ring-primary min-w-[200px]"
            >
              {DESIGN_PROCESS_OPTIONS.map(opt => (
                <option key={opt.code} value={opt.code}>
                  {opt.name}
                </option>
              ))}
            </select>
            <div className="relative">
              <input
                type="number"
                placeholder="예상시간"
                value={addForm.hours}
                onChange={(e) => setAddForm(prev => ({ ...prev, hours: e.target.value }))}
                className="w-28 text-sm border border-border rounded-md pl-2.5 pr-6 py-2 bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                min="0"
                step="0.5"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">h</span>
            </div>
            <button
              onClick={() => void onAdd()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              추가
            </button>
            <span className="text-xs text-muted-foreground ml-1 flex-1">
              {DESIGN_PROCESS_OPTIONS.find(o => o.code === addForm.code)?.description}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
