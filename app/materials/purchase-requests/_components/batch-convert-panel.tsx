'use client';

import React from 'react';
import type { Supplier } from '@/types';

interface BatchConvertPanelProps {
  suppliers: Supplier[];
  selectedSupplierId: string;
  onSupplierChange: (id: string) => void;
  onConvert: () => void;
  onCancel: () => void;
}

export function BatchConvertPanel({
  suppliers,
  selectedSupplierId,
  onSupplierChange,
  onConvert,
  onCancel,
}: BatchConvertPanelProps) {
  return (
    <div className="mb-4 p-4 rounded-lg border border-blue-200 bg-blue-50">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-blue-800">공급처 선택:</label>
        <select
          value={selectedSupplierId}
          onChange={(e) => onSupplierChange(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">-- 공급처 선택 --</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          onClick={onConvert}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          발주 전환 실행
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-muted text-muted-foreground rounded-md text-sm font-medium hover:text-foreground transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  );
}
