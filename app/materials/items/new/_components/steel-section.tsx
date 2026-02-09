'use client';

import React from 'react';
import {
  SteelWeightMethod,
  STEEL_WEIGHT_METHOD_MAP,
  STEEL_GRADE_DENSITY,
} from '@/types';
import type {
  MaterialFormChangeEvent,
  MaterialFormState,
} from './material-form-types';

interface SteelSectionProps {
  form: MaterialFormState;
  steelCalc: { weight: number; unitPrice: number };
  onChange: (e: MaterialFormChangeEvent) => void;
  inputClass: string;
  labelClass: string;
  selectClass: string;
}

export function SteelSection({
  form,
  steelCalc,
  onChange,
  inputClass,
  labelClass,
  selectClass,
}: SteelSectionProps) {
  return (
    <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-4">
      <h4 className="font-semibold text-sm text-primary">
        ======== 강재 정보 ========
      </h4>
      <p className="text-xs text-muted-foreground">
        구매: KG 단위 | 재고: 태그 EA 단위
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>강종 (Steel Grade)</label>
          <select
            name="steel_grade"
            value={form.steel_grade}
            onChange={onChange}
            className={selectClass}
          >
            <option value="">선택하세요</option>
            {Object.keys(STEEL_GRADE_DENSITY).map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>
            밀도 (g/cm³)
          </label>
          <input
            name="density"
            type="number"
            step="0.01"
            value={form.density}
            onChange={onChange}
            placeholder="7.85"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>가로 W (mm)</label>
          <input
            name="dimension_w"
            type="number"
            value={form.dimension_w}
            onChange={onChange}
            placeholder="0"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>세로 L (mm)</label>
          <input
            name="dimension_l"
            type="number"
            value={form.dimension_l}
            onChange={onChange}
            placeholder="0"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>높이 H (mm)</label>
          <input
            name="dimension_h"
            type="number"
            value={form.dimension_h}
            onChange={onChange}
            placeholder="0"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>이론 중량</label>
          <div className="h-9 px-3 flex items-center rounded-md border border-input bg-muted text-sm text-muted-foreground">
            {steelCalc.weight > 0
              ? `${steelCalc.weight.toFixed(2)} kg/EA`
              : '치수를 입력하세요'}
          </div>
        </div>
        <div>
          <label className={labelClass}>중량 산정 방식</label>
          <div className="flex items-center gap-4 h-9">
            {(
              Object.entries(STEEL_WEIGHT_METHOD_MAP) as [
                SteelWeightMethod,
                string,
              ][]
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-1.5 text-sm cursor-pointer"
              >
                <input
                  type="radio"
                  name="weight_method"
                  value={key}
                  checked={form.weight_method === key}
                  onChange={onChange}
                  className="accent-primary"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>KG 단가 (원/kg)</label>
          <input
            name="price_per_kg"
            type="number"
            value={form.price_per_kg}
            onChange={onChange}
            placeholder="0"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>
            EA 단가 (자동계산, 원)
          </label>
          <div className="h-9 px-3 flex items-center rounded-md border border-input bg-muted text-sm text-muted-foreground">
            {steelCalc.unitPrice > 0
              ? `${steelCalc.unitPrice.toLocaleString()}원`
              : '중량 x KG단가'}
          </div>
        </div>
      </div>
    </div>
  );
}
