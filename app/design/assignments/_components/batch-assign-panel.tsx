'use client';

import React from 'react';
import type { Profile } from '@/types';

export interface BatchAssignPanelProps {
  visible: boolean;
  selectedCount: number;
  allUnassignedSelected: boolean;
  batchAssigneeId: string;
  engineers: Profile[];
  onSelectAllUnassigned: () => void;
  onAssigneeChange: (value: string) => void;
  onAssign: () => void;
  onCancel: () => void;
}

export function BatchAssignPanel({
  visible,
  selectedCount,
  allUnassignedSelected,
  batchAssigneeId,
  engineers,
  onSelectAllUnassigned,
  onAssigneeChange,
  onAssign,
  onCancel,
}: BatchAssignPanelProps) {
  if (!visible) return null;

  return (
    <div className="rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-950 p-4 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={allUnassignedSelected}
            onChange={onSelectAllUnassigned}
            className="rounded border-border"
          />
          미배정 전체 선택
        </label>
        <span className="text-sm text-muted-foreground">
          {selectedCount}건 선택됨
        </span>
        <select
          value={batchAssigneeId}
          onChange={(e) => onAssigneeChange(e.target.value)}
          className="text-sm border border-border rounded-md px-3 py-1.5 bg-card focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">설계자 선택</option>
          {engineers.map((eng) => (
            <option key={eng.id} value={eng.id}>
              {eng.name}
            </option>
          ))}
        </select>
        <button
          onClick={onAssign}
          disabled={!batchAssigneeId || selectedCount === 0}
          className="px-4 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          배정하기
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 text-sm rounded-md border border-border text-muted-foreground hover:bg-accent"
        >
          취소
        </button>
      </div>
    </div>
  );
}
