'use client';

import React from 'react';
import { StatusBadge } from '@/components/common/status-badge';
import { PROJECT_STATUS_MAP, PRIORITY_MAP, MOLD_TYPE_MAP } from '@/types';
import type { Project, ProcessStep, MoldType } from '@/types';
import {
  FolderKanban,
  AlertCircle,
  Calendar,
  User,
  Hash,
  Settings2,
} from 'lucide-react';

interface ProjectGridProps {
  designProjects: Project[];
  stepsByProject: Map<string, ProcessStep[]>;
  searchQuery: string;
  getCustomerName: (project: Project) => string | null;
  getDaysRemaining: (dueDate: string) => number;
  onProjectClick: (projectId: string) => void;
}

export function ProjectGrid({
  designProjects,
  stepsByProject,
  searchQuery,
  getCustomerName,
  getDaysRemaining,
  onProjectClick,
}: ProjectGridProps) {
  if (designProjects.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <FolderKanban className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">
          {searchQuery ? '검색 결과가 없습니다.' : '설계 공정을 관리할 프로젝트가 없습니다.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {designProjects.map(project => {
        const steps = stepsByProject.get(project.id) || [];
        const completedCount = steps.filter(s => s.status === 'COMPLETED').length;
        const inProgressCount = steps.filter(s => s.status === 'IN_PROGRESS').length;
        const plannedCount = steps.length - completedCount - inProgressCount;
        const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;
        const totalHours = steps.reduce((sum, s) => sum + (s.estimated_hours || 0), 0);
        const customerName = getCustomerName(project);
        const daysRemaining = getDaysRemaining(project.due_date);
        const hasNoSteps = steps.length === 0;

        return (
          <div
            key={project.id}
            onClick={() => onProjectClick(project.id)}
            className={`rounded-lg border bg-card p-4 cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
              hasNoSteps ? 'border-yellow-400 dark:border-yellow-600' : 'border-border'
            }`}
          >
            {/* Top */}
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground font-mono">{project.project_no}</span>
                  <StatusBadge status={project.priority} statusMap={PRIORITY_MAP} />
                </div>
                <p className="font-semibold truncate">{project.name}</p>
              </div>
              <Settings2 className="h-4 w-4 text-muted-foreground shrink-0 ml-2 mt-1" />
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-3">
              <StatusBadge status={project.status} statusMap={PROJECT_STATUS_MAP} />
              {customerName && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {customerName}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {MOLD_TYPE_MAP[project.mold_type as MoldType] ?? project.mold_type}
              </span>
            </div>

            {/* Due date */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              <Calendar className="h-3 w-3" />
              <span>납기 {project.due_date}</span>
              {daysRemaining <= 0 ? (
                <span className="text-red-500 font-medium">({Math.abs(daysRemaining)}일 초과)</span>
              ) : daysRemaining <= 14 ? (
                <span className="text-yellow-600 font-medium">(D-{daysRemaining})</span>
              ) : (
                <span>(D-{daysRemaining})</span>
              )}
            </div>

            {/* Steps info */}
            {hasNoSteps ? (
              <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-50 dark:bg-yellow-950 text-xs text-yellow-700 dark:text-yellow-400 mb-2">
                <AlertCircle className="h-3.5 w-3.5" />
                설계 공정이 등록되지 않았습니다
              </div>
            ) : (
              <>
                {/* Progress bar */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-8 text-right">{progress}%</span>
                </div>

                {/* Status pills */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {completedCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        {completedCount}
                      </span>
                    )}
                    {inProgressCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        {inProgressCount}
                      </span>
                    )}
                    {plannedCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                        {plannedCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{totalHours}h</span>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
