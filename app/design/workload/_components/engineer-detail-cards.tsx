'use client';

import React from 'react';
import { Users } from 'lucide-react';
import type { EngineerWorkload } from '@/hooks/design/useDesignWorkloadStats';
import type { Profile } from '@/domain/shared/entities';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface EngineerDetailCardsProps {
  engineers: Profile[];
  engineerWorkloads: EngineerWorkload[];
}

export function EngineerDetailCards({ engineers, engineerWorkloads }: EngineerDetailCardsProps) {
  return (
    <>
      <div className="mb-2">
        <h3 className="font-semibold text-lg">설계자별 상세 현황</h3>
        <p className="text-sm text-muted-foreground mt-1">설계자별 담당 프로젝트, 공정 현황, 투입 시간을 확인합니다</p>
      </div>

      {engineers.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">등록된 설계자가 없습니다</p>
          <p className="text-sm mt-1">ENGINEER 역할의 프로필을 추가해주세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {engineerWorkloads.map((ew, index) => (
            <div
              key={ew.engineer.id}
              className="rounded-lg border border-border bg-card overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-border bg-muted/10">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  >
                    {ew.engineer.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-lg">{ew.engineer.name}</p>
                    <p className="text-sm text-muted-foreground">{ew.engineer.department || '설계부'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">프로젝트</p>
                    <p className="text-xl font-bold">{ew.assignedProjects.length}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
                <div className="text-center py-3">
                  <p className="text-xs text-muted-foreground">배정</p>
                  <p className="text-lg font-bold">{ew.assignedCount}</p>
                </div>
                <div className="text-center py-3">
                  <p className="text-xs text-muted-foreground">진행중</p>
                  <p className="text-lg font-bold text-blue-600">{ew.inProgress}</p>
                </div>
                <div className="text-center py-3">
                  <p className="text-xs text-muted-foreground">완료</p>
                  <p className="text-lg font-bold text-green-600">{ew.completed}</p>
                </div>
                <div className="text-center py-3">
                  <p className="text-xs text-muted-foreground">시간</p>
                  <p className="text-lg font-bold">
                    <span className="text-purple-600">{ew.estHours}</span>
                    <span className="text-xs font-normal text-muted-foreground">h</span>
                  </p>
                </div>
              </div>

              {/* Time comparison */}
              {(ew.estHours > 0 || ew.actualHours > 0) && (
                <div className="px-5 py-3 border-b border-border">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>예상 {ew.estHours}h / 실투입 {ew.actualHours}h</span>
                    <span>
                      {ew.estHours > 0 ? `${Math.round((ew.actualHours / ew.estHours) * 100)}%` : '-'}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${ew.estHours > 0 ? Math.min((ew.actualHours / ew.estHours) * 100, 100) : 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Project list */}
              <div className="divide-y divide-border/50">
                {ew.projectDetails.length > 0 ? ew.projectDetails.map(pd => (
                  <div
                    key={pd.project.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">{pd.project.project_no}</span>
                      </div>
                      <p className="text-sm font-medium truncate">{pd.project.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pd.progressPercent}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-20 text-right">
                        {pd.completedForProject}/{pd.totalForProject} ({pd.progressPercent}%)
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="px-5 py-4 text-center">
                    <p className="text-sm text-muted-foreground">담당 설계 공정이 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
