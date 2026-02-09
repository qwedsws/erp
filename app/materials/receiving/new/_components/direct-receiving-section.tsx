'use client';

import React from 'react';
import { Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Material, Project } from '@/types';
import { SteelTagTable, WeightSummary } from './steel-tag-table';
import type { SteelTagEntry } from './steel-tag-table';

interface DirectForm {
  material_id: string;
  quantity: string;
  unit_price: string;
  project_id: string;
  reason: string;
}

interface DirectReceivingSectionProps {
  directForm: DirectForm;
  setDirectForm: React.Dispatch<React.SetStateAction<DirectForm>>;
  directSteelTags: SteelTagEntry[];
  setDirectSteelTags: React.Dispatch<React.SetStateAction<SteelTagEntry[]>>;
  materials: Material[];
  materialById: Map<string, Material>;
  projects: Project[];
  onSubmit: (e: React.FormEvent) => void;
}

export function DirectReceivingSection({
  directForm,
  setDirectForm,
  directSteelTags,
  setDirectSteelTags,
  materials,
  materialById,
  projects,
  onSubmit,
}: DirectReceivingSectionProps) {
  const router = useRouter();

  return (
    <form onSubmit={onSubmit} className="max-w-2xl">
      <div className="rounded-lg border border-border bg-card p-6 space-y-4 mb-6">
        <h3 className="text-sm font-semibold">입고 정보</h3>
        <div>
          <label className="block text-sm font-medium mb-1.5">자재 선택 *</label>
          <select
            value={directForm.material_id}
            onChange={(e) => {
              const matId = e.target.value;
              const mat = materialById.get(matId);
              setDirectForm(prev => ({
                ...prev,
                material_id: matId,
                unit_price: mat?.unit_price ? String(mat.unit_price) : prev.unit_price,
              }));
              // 자재 변경 시 STEEL 태그 초기화
              setDirectSteelTags([]);
            }}
            required
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">선택하세요</option>
            {materials.map(m => (
              <option key={m.id} value={m.id}>
                [{m.material_code}] {m.name} ({m.unit})
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">수량 *</label>
            <input
              type="number"
              value={directForm.quantity}
              onChange={(e) => setDirectForm(prev => ({ ...prev, quantity: e.target.value }))}
              placeholder="0"
              min="1"
              required
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">단가 (원)</label>
            <input
              type="number"
              value={directForm.unit_price}
              onChange={(e) => setDirectForm(prev => ({ ...prev, unit_price: e.target.value }))}
              placeholder="0"
              min="0"
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">프로젝트 (선택)</label>
          <select
            value={directForm.project_id}
            onChange={(e) => setDirectForm(prev => ({ ...prev, project_id: e.target.value }))}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">선택 안함</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                [{p.project_no}] {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">사유</label>
          <textarea
            value={directForm.reason}
            onChange={(e) => setDirectForm(prev => ({ ...prev, reason: e.target.value }))}
            rows={3}
            placeholder="입고 사유를 입력하세요"
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
      </div>

      {/* [Issue 2 fix] 직접 입고 STEEL 태그 섹션 */}
      {(() => {
        const mat = directForm.material_id ? materialById.get(directForm.material_id) : null;
        if (!mat || mat.category !== 'STEEL' || directSteelTags.length === 0) return null;
        const weightMethod = mat.weight_method || 'MEASURED';
        const theoreticalWeight = mat.weight || 0;
        const qty = Number(directForm.quantity) || 0;
        const totalMeasured = directSteelTags.reduce((sum, e) => sum + (Number(e.weight) || 0), 0);
        const theoreticalTotal = qty * theoreticalWeight;

        return (
          <div className="rounded-lg border border-border bg-card p-6 space-y-4 mb-6">
            <div>
              <h4 className="text-sm font-semibold">
                STEEL 태그 등록 ({weightMethod === 'MEASURED' ? '실측' : '계산값'})
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                {mat.name} ({mat.specification}) | {qty} EA
              </p>
            </div>

            <SteelTagTable
              entries={directSteelTags}
              weightMethod={weightMethod}
              showDimensions={true}
              editableDimensions={true}
              onUpdate={(idx, field, val) => {
                setDirectSteelTags(prev =>
                  prev.map((ent, i) => i === idx ? { ...ent, [field]: val } : ent)
                );
              }}
            />

            <WeightSummary
              weightMethod={weightMethod}
              totalMeasured={totalMeasured}
              theoreticalTotal={theoreticalTotal}
            />
          </div>
        );
      })()}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
        >
          <Save size={16} />
          저장
        </button>
        <button
          type="button"
          onClick={() => router.push('/materials/receiving')}
          className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent"
        >
          취소
        </button>
      </div>
    </form>
  );
}
