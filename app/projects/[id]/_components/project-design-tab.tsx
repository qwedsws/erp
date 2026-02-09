'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileText, CheckSquare, List, Pencil } from 'lucide-react';
import type { ProcessStep, Profile, WorkLog, WorkOrder } from '@/types';
import { STEP_STATUS_ICON } from './step-status-icon';

interface ProjectDesignTabProps {
  projectId: string;
  steps: ProcessStep[];
  projectWOs: WorkOrder[];
  workLogs: WorkLog[];
  profileById: Map<string, Profile>;
  progressDesignStep: (projectId: string, stepId: string, action: 'START' | 'COMPLETE') => Promise<{ designCompleted?: boolean }>;
}

const DESIGN_CODES = ['DESIGN_3D', 'DESIGN_2D', 'DESIGN_REVIEW', 'DESIGN_BOM'];

const DELIVERABLES: Record<string, { label: string; icon: React.ReactNode }> = {
  DESIGN_3D: { label: '3D 모델 파일 (CAD)', icon: <FileText size={16} /> },
  DESIGN_2D: { label: '2D 가공 도면', icon: <Pencil size={16} /> },
  DESIGN_REVIEW: { label: '설계 검토 결과서', icon: <CheckSquare size={16} /> },
  DESIGN_BOM: { label: 'BOM 확정서', icon: <List size={16} /> },
};

export function ProjectDesignTab({
  projectId,
  steps,
  projectWOs,
  workLogs,
  profileById,
  progressDesignStep,
}: ProjectDesignTabProps) {
  const [designCompleteMsg, setDesignCompleteMsg] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const designSteps = useMemo(
    () => steps.filter((step) => step.category === 'DESIGN'),
    [steps],
  );
  const designStepIdSet = useMemo(
    () => new Set(designSteps.map((step) => step.id)),
    [designSteps],
  );
  const designWOIdSet = useMemo(
    () =>
      new Set(
        projectWOs
          .filter((wo) => wo.process_step_id && designStepIdSet.has(wo.process_step_id))
          .map((wo) => wo.id),
      ),
    [projectWOs, designStepIdSet],
  );
  const designLogs = useMemo(
    () => workLogs.filter((wl) => designWOIdSet.has(wl.work_order_id)),
    [workLogs, designWOIdSet],
  );
  const designStepByCode = useMemo(
    () => new Map(designSteps.map((step) => [step.process_code, step])),
    [designSteps],
  );

  const completedDesignSteps = designSteps.filter(s => s.status === 'COMPLETED').length;
  const designProgressPct = designSteps.length > 0 ? Math.round((completedDesignSteps / designSteps.length) * 100) : 0;
  const designEstimatedHours = designSteps.reduce((sum, s) => sum + (s.estimated_hours || 0), 0);
  const designActualHours = designLogs.reduce((sum, wl) => sum + (wl.duration || 0), 0) / 60;

  const handleStartStep = useCallback(async (stepId: string) => {
    try {
      await progressDesignStep(projectId, stepId, 'START');
    } catch {
      // Error handling is done at the domain layer
    }
  }, [progressDesignStep, projectId]);

  const handleCompleteStep = useCallback(async (stepId: string) => {
    try {
      const result = await progressDesignStep(projectId, stepId, 'COMPLETE');
      if (!result.designCompleted) return;
      setDesignCompleteMsg(true);
      // Clear any existing timer before setting a new one
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = setTimeout(() => {
        setDesignCompleteMsg(false);
        toastTimerRef.current = null;
      }, 4000);
    } catch {
      // Error handling is done at the domain layer
    }
  }, [progressDesignStep, projectId]);

  const handleApproveReview = useCallback(async (stepId: string) => {
    await handleCompleteStep(stepId);
  }, [handleCompleteStep]);

  return (
    <div className="space-y-6">
      {/* Design Complete Toast */}
      {designCompleteMsg && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-800 font-medium">
          설계 완료! 후속 공정이 활성화되었습니다.
        </div>
      )}

      {/* Design Progress Summary */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-semibold mb-4">설계 진행 현황</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="text-sm">
            <span className="text-muted-foreground">전체 설계 공정</span>
            <p className="text-lg font-bold mt-0.5">{designSteps.length}개</p>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">완료 공정</span>
            <p className="text-lg font-bold mt-0.5 text-green-600">{completedDesignSteps}개</p>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">예상 시간</span>
            <p className="text-lg font-bold mt-0.5">{designEstimatedHours}h</p>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">실제 시간</span>
            <p className="text-lg font-bold mt-0.5">{designActualHours.toFixed(1)}h</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-muted-foreground">설계 진행률</span>
          <span className="font-medium">{designProgressPct}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-blue-500 rounded-full h-2 transition-all" style={{ width: `${designProgressPct}%` }} />
        </div>
      </div>

      {/* Design Process Steps */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-semibold mb-4">설계 공정 목록</h3>
        {designSteps.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">등록된 설계 공정이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {designSteps.map((step) => {
              const assignee = step.assignee_id ? profileById.get(step.assignee_id) : null;
              const isReview = step.process_code === 'DESIGN_REVIEW';
              return (
                <div key={step.id} className={`flex items-center gap-4 p-3 rounded-md border border-border ${step.status === 'IN_PROGRESS' ? 'bg-blue-50 border-blue-200' : ''}`}>
                  <div className="flex items-center gap-2 w-6">{STEP_STATUS_ICON[step.status]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{step.process_name}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{assignee?.name || '-'}</span>
                      <span>{step.estimated_hours ? `${step.estimated_hours}h` : '-'}</span>
                      <span>{step.start_date || '-'} {step.end_date ? `~ ${step.end_date}` : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {step.status === 'PLANNED' && (
                      <button
                        onClick={() => void handleStartStep(step.id)}
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                      >
                        시작
                      </button>
                    )}
                    {step.status === 'IN_PROGRESS' && !isReview && (
                      <button
                        onClick={() => void handleCompleteStep(step.id)}
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors"
                      >
                        완료
                      </button>
                    )}
                    {step.status === 'IN_PROGRESS' && isReview && (
                      <button
                        onClick={() => void handleApproveReview(step.id)}
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                      >
                        승인
                      </button>
                    )}
                    {step.status === 'COMPLETED' && (
                      <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 font-medium">완료</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Design Deliverables */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-semibold mb-4">설계 산출물</h3>
        <div className="space-y-2">
          {DESIGN_CODES.map(code => {
            const step = designStepByCode.get(code);
            const isComplete = step?.status === 'COMPLETED';
            const deliverable = DELIVERABLES[code];
            if (!deliverable) return null;
            return (
              <div key={code} className={`flex items-center gap-3 p-3 rounded-md border border-border ${isComplete ? '' : 'opacity-50'}`}>
                <div className={isComplete ? 'text-primary' : 'text-muted-foreground'}>
                  {deliverable.icon}
                </div>
                <span className={`text-sm flex-1 ${isComplete ? 'font-medium' : 'text-muted-foreground'}`}>
                  {deliverable.label}
                </span>
                {isComplete ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium">완료</span>
                ) : (
                  <span className="text-xs text-muted-foreground">대기중</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
