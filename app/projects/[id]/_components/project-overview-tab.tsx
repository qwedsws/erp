'use client';

import React from 'react';
import { MOLD_TYPE_MAP } from '@/types';
import type { ProjectDetailContext } from './project-detail-types';

interface ProjectOverviewTabProps {
  ctx: ProjectDetailContext;
}

export function ProjectOverviewTab({ ctx }: ProjectOverviewTabProps) {
  const { project, order, customer, manager, steps, projectWOs, projectLogs } = ctx;

  const completedSteps = steps.filter(s => s.status === 'COMPLETED').length;
  const totalHours = projectLogs.reduce((sum, wl) => sum + (wl.duration || 0), 0) / 60;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">기본 정보</h3>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-muted-foreground">프로젝트 번호</dt><dd className="font-medium font-mono mt-0.5">{project.project_no}</dd></div>
            <div><dt className="text-muted-foreground">금형 종류</dt><dd className="font-medium mt-0.5">{MOLD_TYPE_MAP[project.mold_type]}</dd></div>
            <div><dt className="text-muted-foreground">고객사</dt><dd className="font-medium mt-0.5">{customer?.name || '-'}</dd></div>
            <div><dt className="text-muted-foreground">수주 번호</dt><dd className="font-medium font-mono mt-0.5">{order?.order_no || '-'}</dd></div>
            <div><dt className="text-muted-foreground">담당자</dt><dd className="font-medium mt-0.5">{manager?.name || '-'}</dd></div>
            <div><dt className="text-muted-foreground">납기일</dt><dd className="font-medium mt-0.5">{project.due_date}</dd></div>
            <div><dt className="text-muted-foreground">시작일</dt><dd className="font-medium mt-0.5">{project.start_date || '-'}</dd></div>
            <div><dt className="text-muted-foreground">완료일</dt><dd className="font-medium mt-0.5">{project.completed_date || '-'}</dd></div>
          </dl>
          {project.description && (
            <div className="mt-4 pt-4 border-t border-border text-sm">
              <dt className="text-muted-foreground">설명</dt>
              <dd className="mt-1">{project.description}</dd>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">사양</h3>
          {project.specifications ? (
            <dl className="space-y-2 text-sm">
              {Object.entries(project.specifications).map(([k, v]) => (
                <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{String(v)}</dd></div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">사양 정보가 없습니다.</p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">요약</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">전체 공정</span><span className="font-medium">{steps.length}개</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">완료 공정</span><span className="font-medium text-green-600">{completedSteps}개</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">작업 지시</span><span className="font-medium">{projectWOs.length}건</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">투입 시간</span><span className="font-medium">{totalHours.toFixed(1)}h</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
