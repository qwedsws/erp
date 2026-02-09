'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInspections } from '@/hooks/quality/useInspections';
import { useProjects } from '@/hooks/projects/useProjects';
import { useProfiles } from '@/hooks/admin/useProfiles';
import { PageHeader } from '@/components/common/page-header';
import { INSPECTION_TYPE_MAP, InspectionType } from '@/types';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewInspectionPage() {
  const router = useRouter();
  const { projects } = useProjects();
  const { profiles } = useProfiles();
  const { addInspection } = useInspections();

  const [projectId, setProjectId] = useState('');
  const [type, setType] = useState<InspectionType>('INCOMING');
  const [inspectorId, setInspectorId] = useState('');
  const [inspectionDate, setInspectionDate] = useState('');
  const [notes, setNotes] = useState('');

  const eligibleInspectors = profiles.filter(
    p => (p.role === 'QC' || p.role === 'PRODUCTION') && p.is_active
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    await addInspection({
      project_id: projectId,
      type,
      status: 'PLANNED',
      inspector_id: inspectorId || undefined,
      inspection_date: inspectionDate || undefined,
      notes: notes || undefined,
    });

    router.push('/quality/inspections');
  };

  return (
    <div>
      <PageHeader
        title="검사 등록"
        description="새로운 품질 검사를 등록합니다"
        actions={
          <Link
            href="/quality/inspections"
            className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-md text-sm font-medium hover:bg-muted/80"
          >
            <ArrowLeft size={16} /> 목록으로
          </Link>
        }
      />

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            {/* Project select */}
            <div>
              <label className="block text-sm font-medium mb-1">
                프로젝트 <span className="text-red-500">*</span>
              </label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                required
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">프로젝트를 선택하세요</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.project_no} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Inspection type */}
            <div>
              <label className="block text-sm font-medium mb-1">
                검사 유형 <span className="text-red-500">*</span>
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as InspectionType)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {(Object.keys(INSPECTION_TYPE_MAP) as InspectionType[]).map(t => (
                  <option key={t} value={t}>
                    {INSPECTION_TYPE_MAP[t]}
                  </option>
                ))}
              </select>
            </div>

            {/* Inspector */}
            <div>
              <label className="block text-sm font-medium mb-1">검사자</label>
              <select
                value={inspectorId}
                onChange={e => setInspectorId(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">검사자를 선택하세요</option>
                {eligibleInspectors.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium mb-1">검사 예정일</label>
              <input
                type="date"
                value={inspectionDate}
                onChange={e => setInspectionDate(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-1">비고</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="검사 관련 메모를 입력하세요"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            >
              <Save size={16} /> 등록
            </button>
            <button
              type="button"
              onClick={() => router.push('/quality/inspections')}
              className="inline-flex items-center gap-2 px-6 py-2 bg-muted text-foreground rounded-md text-sm font-medium hover:bg-muted/80"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
