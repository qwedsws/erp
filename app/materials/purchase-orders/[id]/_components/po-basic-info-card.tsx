'use client';

import React from 'react';
import { StatusBadge } from '@/components/common/status-badge';
import { PO_STATUS_MAP } from '@/types';
import type { PurchaseOrder, Supplier, Profile } from '@/types';
import type { EditFormState } from '@/hooks/procurement/usePurchaseOrderDetailViewModel';

export interface POBasicInfoCardProps {
  po: PurchaseOrder;
  supplier: Supplier | null;
  creator: Profile | null;
  suppliers: Supplier[];
  isEditing: boolean;
  editForm: EditFormState;
  onEditChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export function POBasicInfoCard({
  po,
  supplier,
  creator,
  suppliers,
  isEditing,
  editForm,
  onEditChange,
}: POBasicInfoCardProps) {
  if (isEditing) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 mb-6">
        <h3 className="font-semibold mb-4">기본 정보</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">발주번호</label>
              <input
                value={po.po_no}
                disabled
                className="w-full h-9 px-3 rounded-md border border-input bg-muted text-sm font-mono cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">공급처 *</label>
              <select
                name="supplier_id"
                value={editForm.supplier_id}
                onChange={onEditChange}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">선택하세요</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">발주일 *</label>
              <input
                type="date"
                name="order_date"
                value={editForm.order_date}
                onChange={onEditChange}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">납기일</label>
              <input
                type="date"
                name="due_date"
                value={editForm.due_date}
                onChange={onEditChange}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">상태</label>
              <div className="h-9 flex items-center">
                <StatusBadge status={po.status} statusMap={PO_STATUS_MAP} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">등록자</label>
              <input
                value={creator?.name || '-'}
                disabled
                className="w-full h-9 px-3 rounded-md border border-input bg-muted text-sm cursor-not-allowed"
              />
            </div>
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
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 mb-6">
      <h3 className="font-semibold mb-4">기본 정보</h3>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-muted-foreground">발주번호</dt>
          <dd className="font-medium font-mono mt-0.5">{po.po_no}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">공급처</dt>
          <dd className="font-medium mt-0.5">{supplier?.name || '-'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">발주일</dt>
          <dd className="font-medium mt-0.5">{po.order_date}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">납기일</dt>
          <dd className="font-medium mt-0.5">{po.due_date || '-'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">상태</dt>
          <dd className="mt-0.5">
            <StatusBadge status={po.status} statusMap={PO_STATUS_MAP} />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">등록자</dt>
          <dd className="font-medium mt-0.5">{creator?.name || '-'}</dd>
        </div>
      </dl>
      {po.notes && (
        <div className="mt-4 pt-4 border-t border-border">
          <dt className="text-sm text-muted-foreground">비고</dt>
          <dd className="text-sm mt-1">{po.notes}</dd>
        </div>
      )}
    </div>
  );
}
