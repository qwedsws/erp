'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useInspections } from '@/hooks/quality/useInspections';
import { useProjects } from '@/hooks/projects/useProjects';
import { useProfiles } from '@/hooks/admin/useProfiles';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import {
  INSPECTION_TYPE_MAP,
  INSPECTION_STATUS_MAP,
  InspectionType,
  InspectionStatus,
} from '@/types';
import { Plus, ClipboardCheck, CheckCircle, Clock } from 'lucide-react';

export default function InspectionsPage() {
  const router = useRouter();
  const { inspections } = useInspections();
  const { projects } = useProjects();
  const { profiles } = useProfiles();

  const [typeFilter, setTypeFilter] = useState<InspectionType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<InspectionStatus | 'ALL'>('ALL');

  const filtered = useMemo(() => {
    return inspections
      .filter(qi => typeFilter === 'ALL' || qi.type === typeFilter)
      .filter(qi => statusFilter === 'ALL' || qi.status === statusFilter)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [inspections, typeFilter, statusFilter]);

  const totalCount = inspections.length;
  const passCount = inspections.filter(qi => qi.status === 'PASS').length;
  const passRate = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;
  const pendingCount = inspections.filter(qi => qi.status === 'PLANNED' || qi.status === 'IN_PROGRESS').length;

  const projectById = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);
  const profileById = useMemo(() => new Map(profiles.map(p => [p.id, p])), [profiles]);

  const getProjectNo = (projectId: string) => projectById.get(projectId)?.project_no || '-';

  const getInspectorName = (inspectorId?: string) => {
    if (!inspectorId) return '-';
    return profileById.get(inspectorId)?.name || '-';
  };

  return (
    <div>
      <PageHeader
        title="품질 검사"
        description="입고검사, 공정검사, 최종검사 현황을 관리합니다"
        actions={
          <Link
            href="/quality/inspections/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            <Plus size={16} /> 검사 등록
          </Link>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
          <div className="p-2 rounded-md bg-blue-100 text-blue-700">
            <ClipboardCheck size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">전체 검사</p>
            <p className="text-xl font-bold">{totalCount}건</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
          <div className="p-2 rounded-md bg-green-100 text-green-700">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">합격률</p>
            <p className="text-xl font-bold">{passRate}%</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
          <div className="p-2 rounded-md bg-yellow-100 text-yellow-700">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">대기 중</p>
            <p className="text-xl font-bold">{pendingCount}건</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">유형:</span>
          {(['ALL', 'INCOMING', 'IN_PROCESS', 'FINAL', 'TRYOUT'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'ALL' ? '전체' : INSPECTION_TYPE_MAP[t]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">상태:</span>
          {(['ALL', 'PLANNED', 'IN_PROGRESS', 'PASS', 'FAIL', 'CONDITIONAL'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'ALL' ? '전체' : INSPECTION_STATUS_MAP[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">검사번호</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">프로젝트</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">검사유형</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">검사자</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">검사일</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(qi => (
              <tr
                key={qi.id}
                className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/30"
                onClick={() => router.push(`/quality/inspections/${qi.id}`)}
              >
                <td className="px-4 py-3 font-mono text-xs">{qi.inspection_no}</td>
                <td className="px-4 py-3">{getProjectNo(qi.project_id)}</td>
                <td className="px-4 py-3">{INSPECTION_TYPE_MAP[qi.type]}</td>
                <td className="px-4 py-3">{getInspectorName(qi.inspector_id)}</td>
                <td className="px-4 py-3">{qi.inspection_date || '-'}</td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={qi.status} statusMap={INSPECTION_STATUS_MAP} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  검사 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">총 {filtered.length}건</div>
    </div>
  );
}
