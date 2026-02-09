import { useMemo } from 'react';
import { Tag } from 'lucide-react';
import { STEEL_TAG_STATUS_MAP } from '@/types';
import type { Project, SteelTag } from '@/types';
import type { TagStats } from '@/hooks/materials/useMaterialDetailViewModel';

function formatDimension(tag: SteelTag): string {
  if (tag.dimension_w && tag.dimension_l && tag.dimension_h) {
    return `${tag.dimension_w}\u00D7${tag.dimension_l}\u00D7${tag.dimension_h}`;
  }
  return '\u2014';
}

function dimensionKey(tag: SteelTag): string {
  if (tag.dimension_w && tag.dimension_l && tag.dimension_h) {
    return `${tag.dimension_w}\u00D7${tag.dimension_l}\u00D7${tag.dimension_h}`;
  }
  return '미지정';
}

interface DimensionGroup {
  key: string;
  total: number;
  available: number;
  allocated: number;
  inUse: number;
}

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
  const dimensionGroups = useMemo<DimensionGroup[]>(() => {
    const map = new Map<string, DimensionGroup>();
    for (const tag of materialTags) {
      const key = dimensionKey(tag);
      let group = map.get(key);
      if (!group) {
        group = { key, total: 0, available: 0, allocated: 0, inUse: 0 };
        map.set(key, group);
      }
      group.total += 1;
      if (tag.status === 'AVAILABLE') group.available += 1;
      else if (tag.status === 'ALLOCATED') group.allocated += 1;
      else if (tag.status === 'IN_USE') group.inUse += 1;
    }
    return Array.from(map.values());
  }, [materialTags]);

  const hasDimensions = materialTags.some(
    (tag) => tag.dimension_w && tag.dimension_l && tag.dimension_h,
  );

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

      {hasDimensions && dimensionGroups.length > 0 && (
        <div className="mb-4 p-3 rounded-md bg-muted/30 border border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">치수별 재고 요약</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {dimensionGroups.map((group) => {
              const parts: string[] = [];
              if (group.available > 0) parts.push(`가용 ${group.available}`);
              if (group.allocated > 0) parts.push(`할당 ${group.allocated}`);
              if (group.inUse > 0) parts.push(`사용중 ${group.inUse}`);
              return (
                <span key={group.key}>
                  <span className="font-medium">{group.key}</span>
                  {': '}
                  {group.total}EA
                  {parts.length > 0 && ` (${parts.join(', ')})`}
                </span>
              );
            })}
          </div>
        </div>
      )}

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
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  치수(mm)
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
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {formatDimension(tag)}
                    </td>
                    <td className="px-3 py-2 text-right">{tag.weight.toFixed(1)} kg</td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {project ? project.project_no : '\u2014'}
                    </td>
                    <td className="px-3 py-2 text-xs">{tag.location || '\u2014'}</td>
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
