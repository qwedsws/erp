'use client';

import React from 'react';
import type {
  MaterialFormChangeEvent,
  MaterialFormState,
} from './material-form-types';

interface ConsumableSectionProps {
  form: MaterialFormState;
  onChange: (e: MaterialFormChangeEvent) => void;
  inputClass: string;
  labelClass: string;
}

export function ConsumableSection({
  form,
  onChange,
  inputClass,
  labelClass,
}: ConsumableSectionProps) {
  return (
    <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-4">
      <h4 className="font-semibold text-sm text-primary">
        ======== 소모품 정보 ========
      </h4>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>최소 발주 수량</label>
          <input
            name="min_order_qty"
            type="number"
            value={form.min_order_qty}
            onChange={onChange}
            placeholder="0"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
