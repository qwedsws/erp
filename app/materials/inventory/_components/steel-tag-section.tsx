'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { STEEL_TAG_STATUS_MAP, type Material, type Project, type SteelTag, type SteelTagStatus } from '@/types';

interface SteelTagStats {
  total: number;
  available: number;
  availableWeight: number;
  allocated: number;
  inUse: number;
  used: number;
}

type SteelTagRow = SteelTag & {
  material?: Material;
  project?: Project | null;
};

interface SteelTagSectionProps {
  projects: Project[];
  steelTagData: SteelTagRow[];
  steelTagStats: SteelTagStats;
  allocatingTagId: string | null;
  allocateProjectId: string;
  setAllocateProjectId: (projectId: string) => void;
  getAvailableActions: (status: SteelTagStatus) => string[];
  startAllocate: (tagId: string) => void;
  cancelAllocate: () => void;
  confirmAllocate: (tagId: string) => Promise<void>;
  handleIssueTag: (tagId: string) => Promise<void>;
  handleCompleteTag: (tagId: string) => Promise<void>;
  handleScrapTag: (tagId: string) => Promise<void>;
}

export function SteelTagSection({
  projects,
  steelTagData,
  steelTagStats,
  allocatingTagId,
  allocateProjectId,
  setAllocateProjectId,
  getAvailableActions,
  startAllocate,
  cancelAllocate,
  confirmAllocate,
  handleIssueTag,
  handleCompleteTag,
  handleScrapTag,
}: SteelTagSectionProps) {
  // Build dimension-grouped summary per material (grade)
  const dimensionSummary = useMemo(() => {
    const materialMap = new Map<string, { grade: string; dims: Map<string, { total: number; available: number }> }>();
    for (const tag of steelTagData) {
      const grade = tag.material?.steel_grade || '기타';
      let entry = materialMap.get(grade);
      if (!entry) {
        entry = { grade, dims: new Map() };
        materialMap.set(grade, entry);
      }
      const hasTagDim = tag.dimension_w && tag.dimension_l && tag.dimension_h;
      const hasMatDim = tag.material?.dimension_w && tag.material?.dimension_l && tag.material?.dimension_h;
      const dimKey = hasTagDim
        ? `${tag.dimension_w}\u00D7${tag.dimension_l}\u00D7${tag.dimension_h}`
        : hasMatDim
          ? `${tag.material!.dimension_w}\u00D7${tag.material!.dimension_l}\u00D7${tag.material!.dimension_h}`
          : '미지정';
      const dimEntry = entry.dims.get(dimKey) ?? { total: 0, available: 0 };
      dimEntry.total += 1;
      if (tag.status === 'AVAILABLE') dimEntry.available += 1;
      entry.dims.set(dimKey, dimEntry);
    }
    return Array.from(materialMap.values());
  }, [steelTagData]);

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <p className="text-xs text-green-700 font-medium">가용</p>
          <p className="text-lg font-bold text-green-800">
            {steelTagStats.available} <span className="text-xs font-normal">EA</span>
          </p>
          <p className="text-xs text-green-600">{steelTagStats.availableWeight.toFixed(1)} kg</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs text-blue-700 font-medium">할당</p>
          <p className="text-lg font-bold text-blue-800">
            {steelTagStats.allocated} <span className="text-xs font-normal">EA</span>
          </p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-xs text-yellow-700 font-medium">사용중</p>
          <p className="text-lg font-bold text-yellow-800">
            {steelTagStats.inUse} <span className="text-xs font-normal">EA</span>
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs text-gray-600 font-medium">완료</p>
          <p className="text-lg font-bold text-gray-800">
            {steelTagStats.used} <span className="text-xs font-normal">EA</span>
          </p>
        </div>
      </div>

      {dimensionSummary.length > 0 && (
        <div className="mb-4 p-3 rounded-md bg-muted/30 border border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">강종별 치수 재고 요약</p>
          <div className="space-y-1 text-xs">
            {dimensionSummary.map((entry) => (
              <div key={entry.grade} className="flex flex-wrap gap-x-1">
                <span className="font-semibold">{entry.grade}:</span>
                <span>
                  가용 {Array.from(entry.dims.values()).reduce((s, d) => s + d.available, 0)}EA
                </span>
                <span className="text-muted-foreground">
                  ({Array.from(entry.dims.entries()).map(([dim, stats], i) => (
                    <span key={dim}>
                      {i > 0 ? ', ' : ''}
                      {dim}: {stats.available}EA
                    </span>
                  ))})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">태그 번호</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">강종</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">치수(mm)</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">중량</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">상태</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">프로젝트</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">위치</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">액션</th>
              </tr>
            </thead>
            <tbody>
              {steelTagData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    등록된 강재 태그가 없습니다.
                  </td>
                </tr>
              ) : (
                steelTagData.map((tag) => {
                  const statusInfo = STEEL_TAG_STATUS_MAP[tag.status as SteelTagStatus];
                  const availableActions = getAvailableActions(tag.status as SteelTagStatus);
                  const canAllocate = availableActions.includes('ALLOCATE');
                  const canIssue = availableActions.includes('ISSUE');
                  const canComplete = availableActions.includes('COMPLETE');
                  const canScrap = availableActions.includes('SCRAP');
                  // Prefer tag-level dimensions; fall back to material-level
                  const hasTagDim = tag.dimension_w && tag.dimension_l && tag.dimension_h;
                  const hasMatDim = tag.material?.dimension_w && tag.material?.dimension_l && tag.material?.dimension_h;
                  const dimension = hasTagDim
                    ? `${tag.dimension_w}\u00D7${tag.dimension_l}\u00D7${tag.dimension_h}`
                    : hasMatDim
                      ? `${tag.material!.dimension_w}\u00D7${tag.material!.dimension_l}\u00D7${tag.material!.dimension_h}`
                      : '\u2014';

                  return (
                    <tr key={tag.id} className="border-b border-border hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs font-medium">{tag.tag_no}</td>
                      <td className="px-4 py-3">{tag.material?.steel_grade || '-'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{dimension || '-'}</td>
                      <td className="px-4 py-3 text-right font-medium">{tag.weight.toFixed(1)} kg</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo?.color || ''}`}
                        >
                          {statusInfo?.label || tag.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {tag.project ? (
                          <Link href={`/projects/${tag.project.id}`} className="text-primary hover:underline text-xs">
                            {tag.project.project_no}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{tag.location || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        {canAllocate && (
                          <>
                            {allocatingTagId === tag.id ? (
                              <div className="flex items-center gap-1 justify-center">
                                <select
                                  value={allocateProjectId}
                                  onChange={(event) => setAllocateProjectId(event.target.value)}
                                  className="text-xs border border-input rounded px-1.5 py-1 bg-background max-w-[120px]"
                                >
                                  <option value="">프로젝트 선택</option>
                                  {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                      {project.project_no}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => void confirmAllocate(tag.id)}
                                  disabled={!allocateProjectId}
                                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                  확인
                                </button>
                                <button
                                  onClick={cancelAllocate}
                                  className="text-xs px-2 py-1 border border-input rounded hover:bg-accent"
                                >
                                  취소
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startAllocate(tag.id)}
                                className="text-xs px-2.5 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                할당
                              </button>
                            )}
                          </>
                        )}
                        {canIssue && (
                          <button
                            onClick={() => void handleIssueTag(tag.id)}
                            className="text-xs px-2.5 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                          >
                            출고
                          </button>
                        )}
                        {(canComplete || canScrap) && (
                          <div className="flex items-center gap-1 justify-center">
                            {canComplete && (
                              <button
                                onClick={() => void handleCompleteTag(tag.id)}
                                className="text-xs px-2.5 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                완료
                              </button>
                            )}
                            {canScrap && (
                              <button
                                onClick={() => void handleScrapTag(tag.id)}
                                className="text-xs px-2.5 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                폐기
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
