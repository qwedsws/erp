'use client';

import React from 'react';
import { Filter, UserPlus } from 'lucide-react';
import type { Project } from '@/types';
import { FILTER_TABS, type StatusFilter } from '@/hooks/design/useDesignAssignmentsViewModel';

export interface AssignmentsToolbarProps {
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  projectFilter: string;
  onProjectFilterChange: (value: string) => void;
  projectsWithDesign: Project[];
  batchMode: boolean;
  onEnterBatchMode: () => void;
}

export function AssignmentsToolbar({
  statusFilter,
  onStatusFilterChange,
  projectFilter,
  onProjectFilterChange,
  projectsWithDesign,
  batchMode,
  onEnterBatchMode,
}: AssignmentsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {/* Project Filter */}
      <select
        value={projectFilter}
        onChange={(e) => onProjectFilterChange(e.target.value)}
        className="text-sm border border-border rounded-md px-3 py-1.5 bg-card focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="ALL">전체 프로젝트</option>
        {projectsWithDesign.map((p) => (
          <option key={p.id} value={p.id}>
            {p.project_no} - {p.name}
          </option>
        ))}
      </select>

      {/* Status Filter Buttons */}
      <div className="flex items-center gap-1">
        <Filter size={14} className="text-muted-foreground" />
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onStatusFilterChange(tab.key)}
            className={`px-3 py-1.5 text-sm rounded-md ${
              statusFilter === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Batch Assign Button */}
      <div className="ml-auto">
        {!batchMode && (
          <button
            onClick={onEnterBatchMode}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <UserPlus size={14} />
            일괄 배정
          </button>
        )}
      </div>
    </div>
  );
}
