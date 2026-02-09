'use client';

import React from 'react';
import type {
  MaterialFormChangeEvent,
  MaterialFormState,
} from './material-form-types';

interface StandardPartSectionProps {
  form: MaterialFormState;
  onChange: (e: MaterialFormChangeEvent) => void;
  inputClass: string;
  labelClass: string;
}

export function StandardPartSection({
  form,
  onChange,
  inputClass,
  labelClass,
}: StandardPartSectionProps) {
  return (
    <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-4">
      <h4 className="font-semibold text-sm text-primary">
        ======== 부품 정보 ========
      </h4>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>규격</label>
          <input
            name="specification"
            value={form.specification}
            onChange={onChange}
            placeholder="예: M8x20"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>단가 (원)</label>
          <input
            name="unit_price"
            type="number"
            value={form.unit_price}
            onChange={onChange}
            placeholder="0"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
