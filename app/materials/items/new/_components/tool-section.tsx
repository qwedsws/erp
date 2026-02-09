'use client';

import React from 'react';
import { ToolType, TOOL_TYPE_MAP } from '@/types';
import type {
  MaterialFormChangeEvent,
  MaterialFormState,
} from './material-form-types';

interface ToolSectionProps {
  form: MaterialFormState;
  onChange: (e: MaterialFormChangeEvent) => void;
  inputClass: string;
  labelClass: string;
  selectClass: string;
}

export function ToolSection({
  form,
  onChange,
  inputClass,
  labelClass,
  selectClass,
}: ToolSectionProps) {
  return (
    <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-4">
      <h4 className="font-semibold text-sm text-primary">
        ======== 공구 정보 ========
      </h4>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>공구 유형</label>
          <select
            name="tool_type"
            value={form.tool_type}
            onChange={onChange}
            className={selectClass}
          >
            <option value="">선택하세요</option>
            {(
              Object.entries(TOOL_TYPE_MAP) as [ToolType, string][]
            ).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>공구 직경 (mm)</label>
          <input
            name="tool_diameter"
            type="number"
            step="0.1"
            value={form.tool_diameter}
            onChange={onChange}
            placeholder="0"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>공구 길이 (mm)</label>
          <input
            name="tool_length"
            type="number"
            step="0.1"
            value={form.tool_length}
            onChange={onChange}
            placeholder="0"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>최대 사용 횟수</label>
          <input
            name="max_usage_count"
            type="number"
            value={form.max_usage_count}
            onChange={onChange}
            placeholder="0"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>재연마 한도</label>
          <input
            name="regrind_max"
            type="number"
            value={form.regrind_max}
            onChange={onChange}
            placeholder="0"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
