'use client';

import React from 'react';
import { Filter, ArrowRightLeft } from 'lucide-react';
import { STATUS_TABS, type StatusTab } from '@/hooks/procurement/usePurchaseRequestsPageData';

interface StatusTabsProps {
  statusFilter: StatusTab;
  onStatusChange: (tab: StatusTab) => void;
  hasCheckedApproved: boolean;
  checkedApprovedCount: number;
  onToggleConvertPanel: () => void;
}

export function StatusTabs({
  statusFilter,
  onStatusChange,
  hasCheckedApproved,
  checkedApprovedCount,
  onToggleConvertPanel,
}: StatusTabsProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center gap-1 text-sm">
        <Filter size={14} className="text-muted-foreground" />
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onStatusChange(tab.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {hasCheckedApproved && (
        <button
          onClick={onToggleConvertPanel}
          className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <ArrowRightLeft size={14} />
          일괄 발주 전환 ({checkedApprovedCount}건)
        </button>
      )}
    </div>
  );
}
