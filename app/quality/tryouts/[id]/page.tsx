'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTryouts } from '@/hooks/quality/useTryouts';
import { useProjects } from '@/hooks/projects/useProjects';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import { TRYOUT_STATUS_MAP, PROJECT_STATUS_MAP } from '@/types';
import { ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react';

export default function TryoutDetailPage() {
  const params = useParams();
  const { tryouts, updateTryout } = useTryouts();
  const { projects } = useProjects();
  const tryoutId = typeof params.id === 'string' ? params.id : params.id?.[0];

  const tryout = tryouts.find(t => t.id === tryoutId);
  if (!tryout) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">트라이아웃 정보를 찾을 수 없습니다.</p>
        <Link
          href="/quality/tryouts"
          className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-md text-sm font-medium hover:bg-muted/80"
        >
          <ArrowLeft size={16} /> 목록으로
        </Link>
      </div>
    );
  }

  const project = projects.find(p => p.id === tryout.project_id);

  const handleStatusChange = (newStatus: 'COMPLETED' | 'APPROVED') => {
    void updateTryout(tryout.id, { status: newStatus });
  };

  return (
    <div>
      <PageHeader
        title={`트라이아웃 상세 - T${tryout.tryout_no}`}
        description={project ? `${project.project_no} - ${project.name}` : ''}
        actions={
          <Link
            href="/quality/tryouts"
            className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-md text-sm font-medium hover:bg-muted/80"
          >
            <ArrowLeft size={16} /> 목록으로
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project & Tryout Info */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-sm font-semibold mb-4">기본 정보</h2>
            <div className="grid grid-cols-2 gap-4">
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
                <p className="text-xs text-muted-foreground">차수</p>
                <p className="text-sm font-medium">T{tryout.tryout_no} ({tryout.tryout_no}차)</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">일자</p>
                <p className="text-sm">{tryout.date || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">설비</p>
                <p className="text-sm">{tryout.machine || '-'}</p>
              </div>
            </div>
          </div>

          {/* Conditions */}
          {tryout.conditions && Object.keys(tryout.conditions).length > 0 && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-sm font-semibold mb-4">성형 조건</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(tryout.conditions).map(([key, value]) => (
                  <div key={key} className="bg-muted/50 rounded-md p-3">
                    <p className="text-xs text-muted-foreground capitalize">{key}</p>
                    <p className="text-sm font-medium">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-sm font-semibold mb-4">결과</h2>
            <p className="text-sm">
              {tryout.results || '아직 결과가 입력되지 않았습니다.'}
            </p>
          </div>

          {/* Issues */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-sm font-semibold mb-4">문제점</h2>
            <p className="text-sm">
              {tryout.issues || '보고된 문제가 없습니다.'}
            </p>
          </div>

          {/* Corrections */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-sm font-semibold mb-4">수정 사항</h2>
            <p className="text-sm">
              {tryout.corrections || '수정 사항이 없습니다.'}
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-sm font-semibold mb-4">상태</h2>
            <div className="flex items-center gap-2 mb-4">
              <StatusBadge status={tryout.status} statusMap={TRYOUT_STATUS_MAP} />
            </div>

            <div className="space-y-2">
              {tryout.status === 'PLANNED' && (
                <button
                  onClick={() => handleStatusChange('COMPLETED')}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  <CheckCircle size={16} /> 완료 처리
                </button>
              )}
              {tryout.status === 'COMPLETED' && (
                <button
                  onClick={() => handleStatusChange('APPROVED')}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                >
                  <ShieldCheck size={16} /> 승인
                </button>
              )}
            </div>

            {/* Status flow */}
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">상태 흐름</p>
              <div className="flex items-center gap-1 text-xs">
                <span className={`px-2 py-1 rounded ${tryout.status === 'PLANNED' ? 'bg-gray-200 font-medium' : 'text-muted-foreground'}`}>
                  예정
                </span>
                <span className="text-muted-foreground">→</span>
                <span className={`px-2 py-1 rounded ${tryout.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800 font-medium' : 'text-muted-foreground'}`}>
                  완료
                </span>
                <span className="text-muted-foreground">→</span>
                <span className={`px-2 py-1 rounded ${tryout.status === 'APPROVED' ? 'bg-green-100 text-green-800 font-medium' : 'text-muted-foreground'}`}>
                  승인
                </span>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-sm font-semibold mb-4">이력</h2>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>생성일</span>
                <span>{new Date(tryout.created_at).toLocaleDateString('ko-KR')}</span>
              </div>
              <div className="flex justify-between">
                <span>수정일</span>
                <span>{new Date(tryout.updated_at).toLocaleDateString('ko-KR')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
