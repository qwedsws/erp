'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWorkOrders } from '@/hooks/production/useWorkOrders';
import { useMachines } from '@/hooks/production/useMachines';
import { useWorkLogs } from '@/hooks/production/useWorkLogs';
import { useProjects } from '@/hooks/projects/useProjects';
import { useProcessSteps } from '@/hooks/projects/useProcessSteps';
import { useProfiles } from '@/hooks/admin/useProfiles';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import { useFeedbackToast } from '@/components/common/feedback-toast-provider';
import { WORK_ORDER_STATUS_MAP, PROJECT_STATUS_MAP } from '@/types';
import { ArrowLeft, Play, Square, Clock } from 'lucide-react';

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { workOrders, startWorkOrder, completeWorkOrder } = useWorkOrders();
  const { machines } = useMachines();
  const { projects } = useProjects();
  const { profiles } = useProfiles();
  const { processSteps } = useProcessSteps();
  const { workLogs, addWorkLog } = useWorkLogs();
  const { showError, showSuccess } = useFeedbackToast();
  const [logForm, setLogForm] = useState({ description: '', duration: '' });
  const workOrderId = typeof params.id === 'string' ? params.id : params.id?.[0];

  const workOrderById = useMemo(
    () => new Map(workOrders.map((workOrder) => [workOrder.id, workOrder])),
    [workOrders],
  );
  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );
  const stepById = useMemo(
    () => new Map(processSteps.map((processStep) => [processStep.id, processStep])),
    [processSteps],
  );
  const profileById = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile])),
    [profiles],
  );
  const machineById = useMemo(
    () => new Map(machines.map((machine) => [machine.id, machine])),
    [machines],
  );

  const wo = workOrderId ? workOrderById.get(workOrderId) : undefined;
  if (!wo) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">작업 지시를 찾을 수 없습니다.</p>
        <button onClick={() => router.push('/production/work-orders')} className="mt-4 text-primary hover:underline text-sm">목록으로 돌아가기</button>
      </div>
    );
  }

  const project = projectById.get(wo.project_id);
  const step = wo.process_step_id ? stepById.get(wo.process_step_id) : undefined;
  const worker = wo.worker_id ? profileById.get(wo.worker_id) : undefined;
  const machine = wo.machine_id ? machineById.get(wo.machine_id) : undefined;
  const logs = workLogs.filter(wl => wl.work_order_id === wo.id).sort((a, b) => b.start_time.localeCompare(a.start_time));
  const totalMinutes = logs.reduce((sum, wl) => sum + (wl.duration || 0), 0);

  const handleStart = async () => {
    try {
      await startWorkOrder(wo.id);
    } catch (err) {
      showError(err instanceof Error ? err.message : '작업 시작 중 오류가 발생했습니다.');
    }
  };

  const handleComplete = async () => {
    try {
      await completeWorkOrder(wo.id);
    } catch (err) {
      showError(err instanceof Error ? err.message : '작업 완료 처리 중 오류가 발생했습니다.');
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logForm.duration) return;
    if (!wo.worker_id) {
      showError('작업자 정보가 없어 실적을 기록할 수 없습니다.');
      return;
    }
    const now = new Date();
    const dur = Number(logForm.duration);
    const start = new Date(now.getTime() - dur * 60000);
    try {
      await addWorkLog({
        work_order_id: wo.id,
        worker_id: wo.worker_id,
        machine_id: wo.machine_id,
        start_time: start.toISOString(),
        end_time: now.toISOString(),
        duration: dur,
        description: logForm.description,
      });
      setLogForm({ description: '', duration: '' });
      showSuccess('작업 실적이 기록되었습니다.');
    } catch (err) {
      showError(err instanceof Error ? err.message : '작업 실적 기록 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.push('/production/work-orders')} className="p-1 rounded hover:bg-accent"><ArrowLeft size={18} /></button>
        <span className="text-sm text-muted-foreground">작업 지시</span>
      </div>
      <PageHeader
        title={wo.work_order_no}
        description={wo.description || ''}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={wo.status} statusMap={WORK_ORDER_STATUS_MAP} />
            {wo.status === 'PLANNED' && (
              <button onClick={() => void handleStart()} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"><Play size={14} /> 작업 시작</button>
            )}
            {wo.status === 'READY' && (
              <button onClick={() => void handleStart()} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"><Play size={14} /> 작업 시작</button>
            )}
            {wo.status === 'IN_PROGRESS' && (
              <button onClick={() => void handleComplete()} className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"><Square size={14} /> 작업 완료</button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">작업 정보</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-muted-foreground">작업지시번호</dt><dd className="font-medium font-mono mt-0.5">{wo.work_order_no}</dd></div>
              <div><dt className="text-muted-foreground">프로젝트</dt><dd className="font-medium mt-0.5">{project ? `${project.project_no} - ${project.name}` : '-'}</dd></div>
              <div><dt className="text-muted-foreground">공정</dt><dd className="font-medium mt-0.5">{step?.process_name || '-'}</dd></div>
              <div><dt className="text-muted-foreground">담당자</dt><dd className="font-medium mt-0.5">{worker?.name || '-'}</dd></div>
              <div><dt className="text-muted-foreground">설비</dt><dd className="font-medium mt-0.5">{machine ? `${machine.name} (${machine.machine_code})` : '-'}</dd></div>
              <div><dt className="text-muted-foreground">예정 기간</dt><dd className="font-medium mt-0.5">
                {wo.planned_start ? new Date(wo.planned_start).toLocaleDateString('ko-KR') : '-'} ~ {wo.planned_end ? new Date(wo.planned_end).toLocaleDateString('ko-KR') : '-'}
              </dd></div>
              {wo.actual_start && <div><dt className="text-muted-foreground">실제 시작</dt><dd className="font-medium mt-0.5">{new Date(wo.actual_start).toLocaleString('ko-KR')}</dd></div>}
              {wo.actual_end && <div><dt className="text-muted-foreground">실제 종료</dt><dd className="font-medium mt-0.5">{new Date(wo.actual_end).toLocaleString('ko-KR')}</dd></div>}
            </dl>
          </div>

          {/* Work Log entry */}
          {wo.status === 'IN_PROGRESS' && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">작업 실적 입력</h3>
              <form onSubmit={handleAddLog} className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1.5">작업 내용</label>
                  <input value={logForm.description} onChange={(e) => setLogForm(prev => ({ ...prev, description: e.target.value }))} placeholder="작업 내용을 입력하세요" className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium mb-1.5">소요시간 (분)</label>
                  <input type="number" value={logForm.duration} onChange={(e) => setLogForm(prev => ({ ...prev, duration: e.target.value }))} placeholder="0" className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <button type="submit" className="h-9 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">기록</button>
              </form>
            </div>
          )}

          {/* Work Logs */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">작업 실적</h3>
              <span className="text-sm text-muted-foreground">총 {(totalMinutes / 60).toFixed(1)}시간</span>
            </div>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">기록된 실적이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {logs.map(log => {
                  const logWorker = profileById.get(log.worker_id);
                  return (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-md bg-muted/30">
                      <Clock size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{log.description || '실적 기록'}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{logWorker?.name}</span>
                          <span>{log.duration}분</span>
                          <span>{new Date(log.start_time).toLocaleString('ko-KR')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">프로젝트 정보</h3>
            {project ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">프로젝트</span><span className="font-mono">{project.project_no}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">프로젝트명</span><span className="font-medium">{project.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">상태</span><StatusBadge status={project.status} statusMap={PROJECT_STATUS_MAP} /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">납기일</span><span>{project.due_date}</span></div>
                <button onClick={() => router.push(`/projects/${project.id}`)} className="w-full mt-2 text-center text-xs text-primary hover:underline">
                  프로젝트 상세보기
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">연결된 프로젝트가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
