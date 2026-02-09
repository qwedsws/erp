'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type {
  EngineerChartDataPoint,
  EngineerHoursDataPoint,
} from '@/hooks/design/useDesignWorkloadStats';

interface EngineerChartsProps {
  engineerChartData: EngineerChartDataPoint[];
  engineerHoursData: EngineerHoursDataPoint[];
}

export function EngineerCharts({ engineerChartData, engineerHoursData }: EngineerChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-semibold mb-4">설계자별 공정 현황</h3>
        <div className="h-64">
          {engineerChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engineerChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" allowDecimals={false} />
                <Tooltip formatter={(value) => `${Number(value)}건`} />
                <Legend />
                <Bar dataKey="완료" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="진행중" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="대기" stackId="a" fill="#d1d5db" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">데이터 없음</div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-semibold mb-4">설계자별 시간 비교 (예상 vs 실투입)</h3>
        <div className="h-64">
          {engineerHoursData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engineerHoursData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(value) => `${Number(value)}h`} />
                <Legend />
                <Bar dataKey="예상시간" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="실투입시간" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">데이터 없음</div>
          )}
        </div>
      </div>
    </div>
  );
}
