'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useInspections } from '@/hooks/quality/useInspections';
import { useProjects } from '@/hooks/projects/useProjects';
import { useProfiles } from '@/hooks/admin/useProfiles';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import {
  INSPECTION_TYPE_MAP,
  INSPECTION_STATUS_MAP,
  PROJECT_STATUS_MAP,
  InspectionStatus,
} from '@/types';
import { ArrowLeft, Play, CheckCircle, XCircle } from 'lucide-react';

export default function InspectionDetailPage() {
  const params = useParams();
  const { inspections, updateInspection } = useInspections();
  const { projects } = useProjects();
  const { profiles } = useProfiles();
  const inspectionId = typeof params.id === 'string' ? params.id : params.id?.[0];

  const inspection = inspections.find(qi => qi.id === inspectionId);
  if (!inspection) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">검사 정보를 찾을 수 없습니다.</p>
        <Link
          href="/quality/inspections"
          className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-md text-sm font-medium hover:bg-muted/80"
        >
          <ArrowLeft size={16} /> 목록으로
        </Link>
      </div>
    );
  }

  const project = projects.find(p => p.id === inspection.project_id);
  const inspector = profiles.find(p => p.id === inspection.inspector_id);

  const handleStatusChange = (newStatus: InspectionStatus) => {
    void updateInspection(inspection.id, { status: newStatus });
  };

  const canStartInspection = inspection.status === 'PLANNED';
  const canCompleteInspection = inspection.status === 'IN_PROGRESS';

  return (
    <div>
      <PageHeader
        title={`검사 상세 - ${inspection.inspection_no}`}
        description={`${INSPECTION_TYPE_MAP[inspection.type]} 상세 정보`}
        actions={
          <Link
            href="/quality/inspections"
            className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-md text-sm font-medium hover:bg-muted/80"
          >
            <ArrowLeft size={16} /> 목록으로
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Inspection Info */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-sm font-semibold mb-4">검사 정보</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">검사번호</p>
                <p className="text-sm font-mono">{inspection.inspection_no}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">검사유형</p>
                <p className="text-sm">{INSPECTION_TYPE_MAP[inspection.type]}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">프로젝트</p>
                {project ? (
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {project.project_no} - {project.name}
                  </Link>
                ) : (
                  <p className="text-sm">-</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">프로젝트 상태</p>
                {project ? (
                  <StatusBadge status={project.status} statusMap={PROJECT_STATUS_MAP} />
                ) : (
                  <p className="text-sm">-</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">검사자</p>
                <p className="text-sm">{inspector?.name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">검사일</p>
                <p className="text-sm">{inspection.inspection_date || '-'}</p>
              </div>
            </div>
          </div>

          {/* Results */}
          {inspection.results && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-sm font-semibold mb-4">검사 결과</h2>
              <div className="bg-muted/50 rounded-md p-4">
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {JSON.stringify(inspection.results, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-sm font-semibold mb-4">비고</h2>
            <p className="text-sm text-muted-foreground">
              {inspection.notes || '등록된 메모가 없습니다.'}
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-sm font-semibold mb-4">상태</h2>
            <div className="flex items-center gap-2 mb-4">
              <StatusBadge status={inspection.status} statusMap={INSPECTION_STATUS_MAP} />
            </div>

            <div className="space-y-2">
              {canStartInspection && (
                <button
                  onClick={() => handleStatusChange('IN_PROGRESS')}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  <Play size={16} /> 검사 시작
                </button>
              )}
              {canCompleteInspection && (
                <>
                  <button
                    onClick={() => handleStatusChange('PASS')}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                  >
                    <CheckCircle size={16} /> 합격
                  </button>
                  <button
                    onClick={() => handleStatusChange('FAIL')}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                  >
                    <XCircle size={16} /> 불합격
                  </button>
                  <button
                    onClick={() => handleStatusChange('CONDITIONAL')}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-md text-sm font-medium hover:bg-yellow-600"
                  >
                    조건부 합격
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-sm font-semibold mb-4">이력</h2>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>생성일</span>
                <span>{new Date(inspection.created_at).toLocaleDateString('ko-KR')}</span>
              </div>
              <div className="flex justify-between">
                <span>수정일</span>
                <span>{new Date(inspection.updated_at).toLocaleDateString('ko-KR')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
