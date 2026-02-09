'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTryouts } from '@/hooks/quality/useTryouts';
import { useProjects } from '@/hooks/projects/useProjects';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import { TRYOUT_STATUS_MAP, TryoutStatus } from '@/types';
import { Plus } from 'lucide-react';

export default function TryoutsPage() {
  const router = useRouter();
  const { tryouts, addTryout } = useTryouts();
  const { projects } = useProjects();

  const [showForm, setShowForm] = useState(false);
  const [formProjectId, setFormProjectId] = useState('');
  const [formTryoutNo, setFormTryoutNo] = useState(1);
  const [formDate, setFormDate] = useState('');
  const [formMachine, setFormMachine] = useState('');
  const [statusFilter, setStatusFilter] = useState<TryoutStatus | 'ALL'>('ALL');

  const filtered = tryouts
    .filter(t => statusFilter === 'ALL' || t.status === statusFilter)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const projectById = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

  const getProjectInfo = (projectId: string) => {
    const project = projectById.get(projectId);
    return project
      ? { no: project.project_no, name: project.name }
      : { no: '-', name: '-' };
  };

  const handleAddTryout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProjectId) return;

    await addTryout({
      project_id: formProjectId,
      tryout_no: formTryoutNo,
      date: formDate || undefined,
      machine: formMachine || undefined,
      status: 'PLANNED',
    });

    setShowForm(false);
    setFormProjectId('');
    setFormTryoutNo(1);
    setFormDate('');
    setFormMachine('');
  };

  return (
    <div>
      <PageHeader
        title="트라이아웃 관리"
        description="금형 트라이아웃 이력을 관리합니다"
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            <Plus size={16} /> 트라이아웃 등록
          </button>
        }
      />

      {/* Inline Form */}
      {showForm && (
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <h3 className="text-sm font-semibold mb-4">트라이아웃 등록</h3>
          <form onSubmit={handleAddTryout} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">
                프로젝트 <span className="text-red-500">*</span>
              </label>
              <select
                value={formProjectId}
                onChange={e => {
                  setFormProjectId(e.target.value);
                  const existingCount = tryouts.filter(t => t.project_id === e.target.value).length;
                  setFormTryoutNo(existingCount + 1);
                }}
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
              <label className="block text-xs font-medium mb-1">차수</label>
              <input
                type="number"
                min={1}
                value={formTryoutNo}
                onChange={e => setFormTryoutNo(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">예정일</label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">설비</label>
              <input
                type="text"
                value={formMachine}
                onChange={e => setFormMachine(e.target.value)}
                placeholder="예: 사출기 350T"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-2">
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

      {/* Status Filter */}
      <div className="flex items-center gap-1 mb-4">
        {(['ALL', 'PLANNED', 'COMPLETED', 'APPROVED'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {s === 'ALL' ? '전체' : TRYOUT_STATUS_MAP[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">프로젝트</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">차수</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">일자</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">설비</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">상태</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(tryout => {
              const projectInfo = getProjectInfo(tryout.project_id);
              return (
                <tr
                  key={tryout.id}
                  className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/30"
                  onClick={() => router.push(`/quality/tryouts/${tryout.id}`)}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs">{projectInfo.no}</span>
                    <span className="text-muted-foreground ml-2">{projectInfo.name}</span>
                  </td>
                  <td className="px-4 py-3 font-medium">T{tryout.tryout_no}</td>
                  <td className="px-4 py-3">{tryout.date || '-'}</td>
                  <td className="px-4 py-3">{tryout.machine || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={tryout.status} statusMap={TRYOUT_STATUS_MAP} />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  트라이아웃 데이터가 없습니다.
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
