'use client';

import React from 'react';
import type { Order, Profile, WorkLog } from '@/types';

interface ProjectCostTabProps {
  order: Order | null;
  projectLogs: WorkLog[];
  profileById: Map<string, Profile>;
}

export function ProjectCostTab({ order, projectLogs, profileById }: ProjectCostTabProps) {
  const laborCost = projectLogs.reduce((sum, wl) => {
    const worker = profileById.get(wl.worker_id);
    return sum + ((wl.duration || 0) / 60) * (worker?.hourly_rate || 35000);
  }, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-semibold mb-4">원가 집계</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">노무비</span>
            <span className="text-sm font-medium">{laborCost.toLocaleString()}원</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">자재비</span>
            <span className="text-sm font-medium text-muted-foreground">- (미집계)</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">외주비</span>
            <span className="text-sm font-medium text-muted-foreground">- (미집계)</span>
          </div>
          <div className="flex items-center justify-between py-2 font-semibold">
            <span>합계</span>
            <span>{laborCost.toLocaleString()}원</span>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-semibold mb-4">수주 대비</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">수주 금액</span>
            <span className="text-sm font-medium">{order?.total_amount ? `${order.total_amount.toLocaleString()}원` : '-'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">현재 원가</span>
            <span className="text-sm font-medium">{laborCost.toLocaleString()}원</span>
          </div>
          {order?.total_amount && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">원가율</span>
              <span className={`text-sm font-bold ${(laborCost / order.total_amount * 100) > 80 ? 'text-red-600' : 'text-green-600'}`}>
                {(laborCost / order.total_amount * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
