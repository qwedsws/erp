'use client';

import React, { useState, useMemo } from 'react';
import { useDefects } from '@/hooks/quality/useDefects';
import { useProjects } from '@/hooks/projects/useProjects';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import {
  DEFECT_TYPE_MAP,
  DEFECT_STATUS_MAP,
  DefectType,
} from '@/types';
import { Plus, AlertTriangle, Search, ChevronDown, ChevronUp } from 'lucide-react';

type DefectStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';

export default function ClaimsPage() {
  const { defects, addDefect, updateDefect } = useDefects();
  const { projects } = useProjects();

  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DefectStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<DefectType | 'ALL'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [formProjectId, setFormProjectId] = useState('');
  const [formDefectType, setFormDefectType] = useState<DefectType>('MACHINING');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const filtered = useMemo(() => {
    return defects
      .filter(d => statusFilter === 'ALL' || d.status === statusFilter)
      .filter(d => typeFilter === 'ALL' || d.defect_type === typeFilter)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [defects, statusFilter, typeFilter]);

  const totalCount = defects.length;
  const openCount = defects.filter(d => d.status === 'OPEN' || d.status === 'INVESTIGATING').length;
  const typeBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    defects.forEach(d => {
      counts[d.defect_type] = (counts[d.defect_type] || 0) + 1;
    });
    return counts;
  }, [defects]);

  const projectById = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

  const getProjectNo = (projectId: string) => projectById.get(projectId)?.project_no || '-';

  const handleAddDefect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProjectId || !formTitle) return;

    await addDefect({
      project_id: formProjectId,
      defect_type: formDefectType,
      title: formTitle,
      description: formDescription,
      reported_date: new Date().toISOString().split('T')[0],
      status: 'OPEN',
    });

    setShowForm(false);
    setFormProjectId('');
    setFormDefectType('MACHINING');
    setFormTitle('');
    setFormDescription('');
  };

  const handleStatusChange = (id: string, newStatus: DefectStatus) => {
    void updateDefect(id, { status: newStatus });
  };

  const getNextStatuses = (current: DefectStatus): { status: DefectStatus; label: string }[] => {
    switch (current) {
      case 'OPEN':
        return [{ status: 'INVESTIGATING', label: '조사 시작' }];
      case 'INVESTIGATING':
        return [{ status: 'RESOLVED', label: '해결 완료' }];
      case 'RESOLVED':
        return [{ status: 'CLOSED', label: '종결' }];
      default:
        return [];
    }
  };

  return (
    <div>
      <PageHeader
        title="불량/클레임 관리"
        description="불량 및 클레임 현황을 관리합니다"
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            <Plus size={16} /> 불량 등록
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
          <div className="p-2 rounded-md bg-red-100 text-red-700">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">전체 불량</p>
            <p className="text-xl font-bold">{totalCount}건</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
          <div className="p-2 rounded-md bg-yellow-100 text-yellow-700">
            <Search size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">미해결</p>
            <p className="text-xl font-bold">{openCount}건</p>
          </div>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-xs text-muted-foreground mb-2">유형별 분포</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(typeBreakdown).map(([type, count]) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs"
              >
                {DEFECT_TYPE_MAP[type as DefectType]} <span className="font-medium">{count}</span>
              </span>
            ))}
            {Object.keys(typeBreakdown).length === 0 && (
              <span className="text-xs text-muted-foreground">데이터 없음</span>
            )}
          </div>
        </div>
      </div>

      {/* Inline Registration Form */}
      {showForm && (
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <h3 className="text-sm font-semibold mb-4">불량 등록</h3>
          <form onSubmit={handleAddDefect} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">
                  프로젝트 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formProjectId}
                  onChange={e => setFormProjectId(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">프로젝트 선택</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.project_no} - {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  불량 유형 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formDefectType}
                  onChange={e => setFormDefectType(e.target.value as DefectType)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {(Object.keys(DEFECT_TYPE_MAP) as DefectType[]).map(t => (
                    <option key={t} value={t}>
                      {DEFECT_TYPE_MAP[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  required
                  placeholder="불량 제목을 입력하세요"
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">설명</label>
              <textarea
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                rows={2}
                placeholder="불량 내용을 상세히 기술하세요"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
              >
                등록
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-md text-sm font-medium hover:bg-muted/80"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">상태:</span>
          {(['ALL', 'OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'ALL' ? '전체' : DEFECT_STATUS_MAP[s]?.label || s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">유형:</span>
          {(['ALL', 'DESIGN', 'MACHINING', 'ASSEMBLY', 'MATERIAL', 'OTHER'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'ALL' ? '전체' : DEFECT_TYPE_MAP[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Table with expandable rows */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-8"></th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">프로젝트</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">불량유형</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">제목</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">보고일</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">상태</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">조치</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(defect => {
              const isExpanded = expandedId === defect.id;
              const nextStatuses = getNextStatuses(defect.status as DefectStatus);

              return (
                <React.Fragment key={defect.id}>
                  <tr
                    className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/30"
                    onClick={() => setExpandedId(isExpanded ? null : defect.id)}
                  >
                    <td className="px-4 py-3">
                      {isExpanded ? (
                        <ChevronUp size={14} className="text-muted-foreground" />
                      ) : (
                        <ChevronDown size={14} className="text-muted-foreground" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{getProjectNo(defect.project_id)}</td>
                    <td className="px-4 py-3">{DEFECT_TYPE_MAP[defect.defect_type]}</td>
                    <td className="px-4 py-3 font-medium">{defect.title}</td>
                    <td className="px-4 py-3">{defect.reported_date}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={defect.status} statusMap={DEFECT_STATUS_MAP} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                        {nextStatuses.map(ns => (
                          <button
                            key={ns.status}
                            onClick={() => handleStatusChange(defect.id, ns.status)}
                            className="px-2 py-1 text-xs rounded bg-primary/10 text-primary hover:bg-primary/20 font-medium"
                          >
                            {ns.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-b border-border bg-muted/20">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">설명</p>
                            <p>{defect.description || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">원인</p>
                            <p>{defect.cause || '미확인'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">대책</p>
                            <p>{defect.countermeasure || '미수립'}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  불량/클레임 데이터가 없습니다.
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
