import type { ChangeEvent } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import {
  MATERIAL_CATEGORY_MAP,
  STEEL_WEIGHT_METHOD_MAP,
  TOOL_TYPE_MAP,
} from '@/types';
import type { Material, Supplier } from '@/types';
import type { MaterialEditForm } from '@/hooks/materials/useMaterialDetailViewModel';

interface MaterialInfoSectionProps {
  material: Material;
  suppliers: Supplier[];
  mainSupplier: Supplier | null;
  isEditing: boolean;
  editForm: MaterialEditForm;
  onEditChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
}

export function MaterialInfoSection({
  material,
  suppliers,
  mainSupplier,
  isEditing,
  editForm,
  onEditChange,
}: MaterialInfoSectionProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Package size={16} />
        기본 정보
      </h3>
      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">자재코드</label>
              <input
                value={material.material_code}
                disabled
                className="w-full h-9 px-3 rounded-md border border-input bg-muted text-sm text-muted-foreground font-mono cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">자재명 *</label>
              <input
                name="name"
                value={editForm.name}
                onChange={onEditChange}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">분류 *</label>
              <select
                name="category"
                value={editForm.category}
                onChange={onEditChange}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">선택하세요</option>
                {(Object.entries(MATERIAL_CATEGORY_MAP) as [string, string][]).map(
                  ([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">규격</label>
              <input
                name="specification"
                value={editForm.specification}
                onChange={onEditChange}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">단위 *</label>
              <select
                name="unit"
                value={editForm.unit}
                onChange={onEditChange}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">선택하세요</option>
                <option value="KG">KG</option>
                <option value="EA">EA</option>
                <option value="SET">SET</option>
                <option value="M">M</option>
                <option value="ROLL">ROLL</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                기준 단가 (원)
              </label>
              <input
                name="unit_price"
                type="number"
                value={editForm.unit_price}
                onChange={onEditChange}
                placeholder="0"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">안전재고</label>
              <input
                name="safety_stock"
                type="number"
                value={editForm.safety_stock}
                onChange={onEditChange}
                placeholder="0"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                리드타임 (일)
              </label>
              <input
                name="lead_time"
                type="number"
                value={editForm.lead_time}
                onChange={onEditChange}
                placeholder="0"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">주 공급처</label>
            <select
              name="supplier_id"
              value={editForm.supplier_id}
              onChange={onEditChange}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">선택하세요</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">비고</label>
            <textarea
              name="notes"
              value={editForm.notes}
              onChange={onEditChange}
              rows={3}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>
      ) : (
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">자재코드</dt>
            <dd className="font-medium font-mono mt-0.5">{material.material_code}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">자재명</dt>
            <dd className="font-medium mt-0.5">{material.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">분류</dt>
            <dd className="font-medium mt-0.5">
              {MATERIAL_CATEGORY_MAP[material.category]}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">규격</dt>
            <dd className="font-medium mt-0.5">{material.specification || '-'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">단위</dt>
            <dd className="font-medium mt-0.5">{material.unit}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">기준 단가</dt>
            <dd className="font-medium mt-0.5">
              {material.unit_price ? `${material.unit_price.toLocaleString()}원` : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">안전재고</dt>
            <dd className="font-medium mt-0.5">
              {material.safety_stock != null
                ? material.safety_stock.toLocaleString()
                : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">리드타임</dt>
            <dd className="font-medium mt-0.5">
              {material.lead_time != null ? `${material.lead_time}일` : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">주 공급처</dt>
            <dd className="font-medium mt-0.5">
              {mainSupplier ? (
                <Link
                  href={`/materials/suppliers/${mainSupplier.id}`}
                  className="text-primary hover:underline"
                >
                  {mainSupplier.name}
                </Link>
              ) : (
                '-'
              )}
            </dd>
          </div>

          {material.category === 'STEEL' && (
            <>
              <div>
                <dt className="text-muted-foreground">강종</dt>
                <dd className="font-medium mt-0.5">{material.steel_grade || '-'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">밀도</dt>
                <dd className="font-medium mt-0.5">
                  {material.density ? `${material.density} g/cm³` : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">치수</dt>
                <dd className="font-medium mt-0.5">
                  {material.dimension_w && material.dimension_l && material.dimension_h
                    ? `${material.dimension_w}×${material.dimension_l}×${material.dimension_h} mm`
                    : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">이론 중량</dt>
                <dd className="font-medium mt-0.5">
                  {material.weight ? `${material.weight.toFixed(2)} kg/EA` : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">kg당 단가</dt>
                <dd className="font-medium mt-0.5">
                  {material.price_per_kg
                    ? `${material.price_per_kg.toLocaleString()}원/kg`
                    : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">중량 방식</dt>
                <dd className="font-medium mt-0.5">
                  {material.weight_method
                    ? STEEL_WEIGHT_METHOD_MAP[material.weight_method]
                    : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">구매/재고 단위</dt>
                <dd className="font-medium mt-0.5">KG (구매) / EA (태그 재고)</dd>
              </div>
            </>
          )}

          {material.category === 'TOOL' && (
            <>
              <div>
                <dt className="text-muted-foreground">공구 유형</dt>
                <dd className="font-medium mt-0.5">
                  {material.tool_type ? TOOL_TYPE_MAP[material.tool_type] : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">직경</dt>
                <dd className="font-medium mt-0.5">
                  {material.tool_diameter ? `${material.tool_diameter}mm` : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">전장</dt>
                <dd className="font-medium mt-0.5">
                  {material.tool_length ? `${material.tool_length}mm` : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">최대 수명</dt>
                <dd className="font-medium mt-0.5">
                  {material.max_usage_count ? `${material.max_usage_count}회` : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">최대 재연마</dt>
                <dd className="font-medium mt-0.5">
                  {material.regrind_max != null ? `${material.regrind_max}회` : '-'}
                </dd>
              </div>
            </>
          )}

          {material.category === 'CONSUMABLE' && (
            <div>
              <dt className="text-muted-foreground">최소 발주 수량</dt>
              <dd className="font-medium mt-0.5">{material.min_order_qty || '-'}</dd>
            </div>
          )}

          {material.notes && (
            <div className="col-span-2">
              <dt className="text-muted-foreground">비고</dt>
              <dd className="font-medium mt-0.5">{material.notes}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
