import { Tag } from 'lucide-react';
import { STEEL_TAG_STATUS_MAP } from '@/types';
import type { Project, SteelTag } from '@/types';
import type { TagStats } from '@/hooks/materials/useMaterialDetailViewModel';

interface SteelTagSectionProps {
  materialTags: SteelTag[];
  tagStats: TagStats;
  projectById: Map<string, Project>;
}

export function SteelTagSection({
  materialTags,
  tagStats,
  projectById,
}: SteelTagSectionProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Tag size={16} />
        태그 현황
      </h3>
      <div className="grid grid-cols-6 gap-2 mb-4">
        <div className="rounded-md bg-muted/50 p-2 text-center">
          <p className="text-xs text-muted-foreground">전체</p>
          <p className="text-lg font-bold">{tagStats.total}</p>
        </div>
        <div className="rounded-md bg-green-50 p-2 text-center">
          <p className="text-xs text-muted-foreground">가용</p>
          <p className="text-lg font-bold text-green-600">{tagStats.available}</p>
        </div>
        <div className="rounded-md bg-blue-50 p-2 text-center">
          <p className="text-xs text-muted-foreground">할당</p>
          <p className="text-lg font-bold text-blue-600">{tagStats.allocated}</p>
        </div>
        <div className="rounded-md bg-yellow-50 p-2 text-center">
          <p className="text-xs text-muted-foreground">사용중</p>
          <p className="text-lg font-bold text-yellow-600">{tagStats.inUse}</p>
        </div>
        <div className="rounded-md bg-gray-50 p-2 text-center">
          <p className="text-xs text-muted-foreground">완료</p>
          <p className="text-lg font-bold">{tagStats.used}</p>
        </div>
        <div className="rounded-md bg-red-50 p-2 text-center">
          <p className="text-xs text-muted-foreground">폐기</p>
          <p className="text-lg font-bold text-red-600">{tagStats.scrap}</p>
        </div>
      </div>
      {materialTags.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          등록된 태그가 없습니다.
        </p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  태그 번호
                </th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                  중량
                </th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                  상태
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  프로젝트
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  위치
                </th>
              </tr>
            </thead>
            <tbody>
              {materialTags.map((tag) => {
                const project = tag.project_id
                  ? projectById.get(tag.project_id) ?? null
                  : null;
                const statusInfo = STEEL_TAG_STATUS_MAP[tag.status];
                return (
                  <tr key={tag.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-mono text-xs">{tag.tag_no}</td>
                    <td className="px-3 py-2 text-right">{tag.weight.toFixed(1)} kg</td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {project ? project.project_no : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs">{tag.location || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
