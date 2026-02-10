'use client';

import React from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/common/status-badge';
import { PO_STATUS_MAP } from '@/types';
import type { PurchaseOrderStatus } from '@/types';
import { CheckCircle2, PackagePlus, Trash2, Pencil, Save, X, Ban } from 'lucide-react';

export interface POHeaderActionsProps {
  poId: string;
  status: PurchaseOrderStatus;
  isEditing: boolean;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onConfirmOrder: () => void;
  onDelete: () => void;
  onCancelOrder: () => void;
}

export function POHeaderActions({
  poId,
  status,
  isEditing,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onConfirmOrder,
  onDelete,
  onCancelOrder,
}: POHeaderActionsProps) {
  const renderActions = () => {
    if (isEditing) {
      return (
        <>
          <button
            onClick={onSaveEdit}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            <Save size={16} />
            저장
          </button>
          <button
            onClick={onCancelEdit}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-input rounded-md text-sm hover:bg-accent"
          >
            <X size={16} />
            취소
          </button>
        </>
      );
    }

    switch (status) {
      case 'DRAFT':
        return (
          <>
            <button
              onClick={onStartEdit}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-input rounded-md text-sm hover:bg-accent"
            >
              <Pencil size={16} />
              수정
            </button>
            <button
              onClick={onConfirmOrder}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            >
              <CheckCircle2 size={16} />
              발주 확정
            </button>
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-destructive text-destructive rounded-md text-sm font-medium hover:bg-destructive/10"
            >
              <Trash2 size={16} />
              삭제
            </button>
          </>
        );
      case 'ORDERED':
        return (
          <>
            <Link
              href={`/materials/receiving/new?po=${poId}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            >
              <PackagePlus size={16} />
              입고 처리
            </Link>
            <button
              onClick={onCancelOrder}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-destructive text-destructive rounded-md text-sm font-medium hover:bg-destructive/10"
            >
              <Ban size={16} />
              발주 취소
            </button>
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-destructive text-destructive rounded-md text-sm font-medium hover:bg-destructive/10"
            >
              <Trash2 size={16} />
              삭제
            </button>
          </>
        );
      case 'PARTIAL_RECEIVED':
        return (
          <Link
            href={`/materials/receiving/new?po=${poId}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            <PackagePlus size={16} />
            추가 입고
          </Link>
        );
      case 'CANCELLED':
        return (
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-destructive text-destructive rounded-md text-sm font-medium hover:bg-destructive/10"
          >
            <Trash2 size={16} />
            삭제
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={status} statusMap={PO_STATUS_MAP} />
      {renderActions()}
    </div>
  );
}
