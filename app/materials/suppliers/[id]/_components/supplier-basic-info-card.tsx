'use client';

import type { ChangeEvent } from 'react';
import { Building2 } from 'lucide-react';
import { SUPPLIER_TYPE_MAP, type Supplier } from '@/types';

type SupplierType = '' | 'MATERIAL' | 'OUTSOURCE' | 'BOTH';

interface SupplierEditForm {
  name: string;
  business_no: string;
  supplier_type: SupplierType;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

interface SupplierBasicInfoCardProps {
  supplier: Supplier;
  isEditing: boolean;
  editForm: SupplierEditForm;
  onEditChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
}

export function SupplierBasicInfoCard({
  supplier,
  isEditing,
  editForm,
  onEditChange,
}: SupplierBasicInfoCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Building2 size={16} />
        기본 정보
      </h3>
      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">업체명 *</label>
              <input
                name="name"
                value={editForm.name}
                onChange={onEditChange}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">사업자번호</label>
              <input
                name="business_no"
                value={editForm.business_no}
                onChange={onEditChange}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">업체 유형</label>
              <select
                name="supplier_type"
                value={editForm.supplier_type}
                onChange={onEditChange}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">선택하세요</option>
                {(Object.entries(SUPPLIER_TYPE_MAP) as [string, string][]).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">담당자</label>
              <input
                name="contact_person"
                value={editForm.contact_person}
                onChange={onEditChange}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">연락처</label>
              <input
                name="phone"
                value={editForm.phone}
                onChange={onEditChange}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">이메일</label>
              <input
                name="email"
                type="email"
                value={editForm.email}
                onChange={onEditChange}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">주소</label>
            <input
              name="address"
              value={editForm.address}
              onChange={onEditChange}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
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
            <dt className="text-muted-foreground">업체명</dt>
            <dd className="font-medium mt-0.5">{supplier.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">사업자번호</dt>
            <dd className="font-medium mt-0.5">{supplier.business_no || '-'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">유형</dt>
            <dd className="font-medium mt-0.5">
              {supplier.supplier_type ? SUPPLIER_TYPE_MAP[supplier.supplier_type] || supplier.supplier_type : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">담당자</dt>
            <dd className="font-medium mt-0.5">{supplier.contact_person || '-'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">연락처</dt>
            <dd className="font-medium mt-0.5">{supplier.phone || '-'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">이메일</dt>
            <dd className="font-medium mt-0.5">{supplier.email || '-'}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted-foreground">주소</dt>
            <dd className="font-medium mt-0.5">{supplier.address || '-'}</dd>
          </div>
          {supplier.notes && (
            <div className="col-span-2">
              <dt className="text-muted-foreground">비고</dt>
              <dd className="font-medium mt-0.5">{supplier.notes}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
