'use client';

import { AlertTriangle, CircleDollarSign, Clock, PackagePlus } from 'lucide-react';

interface ReceivingKpiCardsProps {
  monthlyCount: number;
  monthlyAmount: number;
  pendingPOCount: number;
  overduePOCount: number;
  pendingAmount: number;
}

export function ReceivingKpiCards({
  monthlyCount,
  monthlyAmount,
  pendingPOCount,
  overduePOCount,
  pendingAmount,
}: ReceivingKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50">
            <PackagePlus size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">이번 달 입고</p>
            <p className="text-2xl font-bold">
              {monthlyCount}
              <span className="text-sm font-normal text-muted-foreground ml-1">건</span>
            </p>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-green-50">
            <CircleDollarSign size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">이번 달 입고 금액</p>
            <p className="text-2xl font-bold">
              {(monthlyAmount / 10000).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              <span className="text-sm font-normal text-muted-foreground ml-1">만원</span>
            </p>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-orange-50">
            <Clock size={20} className="text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">미입고 발주</p>
            <p className="text-2xl font-bold">
              {pendingPOCount}
              <span className="text-sm font-normal text-muted-foreground ml-1">건</span>
              {overduePOCount > 0 && (
                <span className="text-xs font-medium text-red-600 ml-2">
                  (납기초과 {overduePOCount})
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-50">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">미입고 금액</p>
            <p className="text-2xl font-bold">
              {(pendingAmount / 10000).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              <span className="text-sm font-normal text-muted-foreground ml-1">만원</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
