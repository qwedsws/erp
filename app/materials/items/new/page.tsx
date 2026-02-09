'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/common/page-header';
import {
  MaterialCategory,
  MATERIAL_CATEGORY_MAP,
} from '@/types';
import { ArrowLeft } from 'lucide-react';
import { useSuppliers } from '@/hooks/procurement/useSuppliers';
import { useMaterialForm } from '@/hooks/materials/useMaterialForm';
import { SteelSection } from './_components/steel-section';
import { ToolSection } from './_components/tool-section';
import { ConsumableSection } from './_components/consumable-section';
import { StandardPartSection } from './_components/standard-part-section';

const inputClass =
  'w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring';
const selectClass = inputClass;
const labelClass = 'block text-sm font-medium mb-1.5';

export default function NewMaterialPage() {
  const router = useRouter();
  const { suppliers } = useSuppliers();
  const { form, category, steelCalc, handleChange, handleSubmit } =
    useMaterialForm();

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => router.push('/materials/items')}
          className="p-1 rounded hover:bg-accent"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="text-sm text-muted-foreground">자재 마스터</span>
      </div>
      <PageHeader title="자재 등록" description="새로운 자재를 등록합니다" />
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>자재코드 *</label>
              <input
                name="material_code"
                value={form.material_code}
                onChange={handleChange}
                required
                placeholder="예: STL-001"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>자재명 *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="예: SKD11 강재"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>분류 *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className={selectClass}
              >
                {(
                  Object.entries(MATERIAL_CATEGORY_MAP) as [
                    MaterialCategory,
                    string,
                  ][]
                ).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>단위 *</label>
              {category === 'STEEL' ? (
                <input
                  value="KG (구매단위)"
                  disabled
                  className={inputClass + ' bg-muted text-muted-foreground'}
                />
              ) : category === 'CONSUMABLE' ? (
                <select
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="KG">KG</option>
                  <option value="L">L</option>
                  <option value="EA">EA</option>
                  <option value="ROLL">ROLL</option>
                  <option value="M">M</option>
                </select>
              ) : category === 'STANDARD_PART' || category === 'PURCHASED' ? (
                <select
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="EA">EA</option>
                  <option value="SET">SET</option>
                </select>
              ) : (
                <input
                  value="EA"
                  disabled
                  className={inputClass + ' bg-muted text-muted-foreground'}
                />
              )}
            </div>
          </div>

          {/* Category-specific sections */}
          {category === 'STEEL' && (
            <SteelSection
              form={form}
              steelCalc={steelCalc}
              onChange={handleChange}
              inputClass={inputClass}
              labelClass={labelClass}
              selectClass={selectClass}
            />
          )}

          {category === 'TOOL' && (
            <ToolSection
              form={form}
              onChange={handleChange}
              inputClass={inputClass}
              labelClass={labelClass}
              selectClass={selectClass}
            />
          )}

          {category === 'CONSUMABLE' && (
            <ConsumableSection
              form={form}
              onChange={handleChange}
              inputClass={inputClass}
              labelClass={labelClass}
            />
          )}

          {(category === 'STANDARD_PART' || category === 'PURCHASED') && (
            <StandardPartSection
              form={form}
              onChange={handleChange}
              inputClass={inputClass}
              labelClass={labelClass}
            />
          )}

          {/* 규격 (not shown for STANDARD_PART/PURCHASED since it's inside their section) */}
          {category !== 'STANDARD_PART' && category !== 'PURCHASED' && (
            <div>
              <label className={labelClass}>규격</label>
              <input
                name="specification"
                value={form.specification}
                onChange={handleChange}
                placeholder="예: 200x300x50mm"
                className={inputClass}
              />
            </div>
          )}

          {/* 단가 (not shown for STEEL since it's auto-calculated, nor for STANDARD_PART/PURCHASED since it's in their section) */}
          {category !== 'STEEL' &&
            category !== 'STANDARD_PART' &&
            category !== 'PURCHASED' && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>단가 (원)</label>
                  <input
                    name="unit_price"
                    type="number"
                    value={form.unit_price}
                    onChange={handleChange}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>안전재고</label>
                  <input
                    name="safety_stock"
                    type="number"
                    value={form.safety_stock}
                    onChange={handleChange}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>리드타임 (일)</label>
                  <input
                    name="lead_time"
                    type="number"
                    value={form.lead_time}
                    onChange={handleChange}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

          {/* STEEL and STANDARD_PART/PURCHASED still need safety_stock and lead_time */}
          {(category === 'STEEL' ||
            category === 'STANDARD_PART' ||
            category === 'PURCHASED') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>안전재고</label>
                <input
                  name="safety_stock"
                  type="number"
                  value={form.safety_stock}
                  onChange={handleChange}
                  placeholder="0"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>리드타임 (일)</label>
                <input
                  name="lead_time"
                  type="number"
                  value={form.lead_time}
                  onChange={handleChange}
                  placeholder="0"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>주 공급처</label>
            <select
              name="supplier_id"
              value={form.supplier_id}
              onChange={handleChange}
              className={selectClass}
            >
              <option value="">선택하세요</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>비고</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            저장
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
