'use client';

import React from 'react';
import { PageHeader } from '@/components/common/page-header';
import {
  useSalesStatisticsData,
  type OrderCollectionRow,
  type CustomerOutstandingRow,
} from '@/hooks/sales/useSalesStatisticsData';
import {
  TrendingUp,
  Banknote,
  AlertCircle,
  Percent,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function formatAmount(amount: number) {
  return (amount / 10000).toLocaleString() + '만원';
}

function RateBar({ rate }: { rate: number }) {
  return (
    <div className="w-full bg-muted rounded-full h-2">
      <div
        className={`h-2 rounded-full ${
          rate >= 100 ? 'bg-green-500' : rate >= 50 ? 'bg-blue-500' : 'bg-yellow-500'
        }`}
        style={{ width: `${Math.min(rate, 100)}%` }}
      />
    </div>
  );
}

export default function SalesStatisticsPage() {
  const {
    kpi,
    monthlyData,
    customerRanking,
    paymentTypeData,
    paymentMethodData,
    orderCollectionData,
    customerOutstandingData,
  } = useSalesStatisticsData();

  return (
    <div>
      <PageHeader title="영업 통계" description="매출 추이, 고객별 매출, 입금 현황을 확인하세요" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">총 수주액</p>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{formatAmount(kpi.totalOrderAmount)}</p>
          <p className="text-xs text-muted-foreground mt-1">전체 {kpi.orderCount}건</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">입금 완료액</p>
            <Banknote className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{formatAmount(kpi.totalPaidAmount)}</p>
          <p className="text-xs text-muted-foreground mt-1">확인 {kpi.confirmedPaymentCount}건</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">미수금액</p>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold mt-2 text-red-600">{formatAmount(kpi.outstandingAmount)}</p>
          <p className="text-xs text-muted-foreground mt-1">수주액 - 입금완료액</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">수금률</p>
            <Percent className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{kpi.collectionRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">입금완료 / 수주액</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Order/Payment Trend */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold mb-4">월별 수주/입금 추이 (만원)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(value) => Number(value).toLocaleString() + '만원'} />
                <Legend />
                <Bar dataKey="수주액" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="입금액" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Customers */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold mb-4">고객별 매출 TOP5 (만원)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerRanking} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="name" type="category" className="text-xs" width={120} />
                <Tooltip formatter={(value) => Number(value).toLocaleString() + '만원'} />
                <Bar dataKey="금액" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Payment Type Distribution */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold mb-4">입금 유형별 분포</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                >
                  {paymentTypeData.map((_, index) => (
                    <Cell key={`type-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatAmount(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method Distribution */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold mb-4">입금 방법별 분포</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                >
                  {paymentMethodData.map((_, index) => (
                    <Cell key={`method-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatAmount(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Collection Status Table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">수주별 수금 현황</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-medium">수주번호</th>
                <th className="text-left p-3 font-medium">고객</th>
                <th className="text-right p-3 font-medium">수주금액</th>
                <th className="text-right p-3 font-medium">입금완료</th>
                <th className="text-right p-3 font-medium">잔여</th>
                <th className="text-center p-3 font-medium">수금률</th>
                <th className="p-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {orderCollectionData.map((row: OrderCollectionRow) => (
                <tr key={row.order_no} className="border-b border-border hover:bg-muted/20">
                  <td className="p-3 font-mono text-xs">{row.order_no}</td>
                  <td className="p-3">{row.customer_name}</td>
                  <td className="p-3 text-right">{formatAmount(row.total)}</td>
                  <td className="p-3 text-right text-green-600">{formatAmount(row.paid)}</td>
                  <td className="p-3 text-right text-red-600">{formatAmount(row.remaining)}</td>
                  <td className="p-3 text-center">{row.rate}%</td>
                  <td className="p-3">
                    <RateBar rate={row.rate} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Outstanding Balance Table */}
      <div className="rounded-lg border border-border bg-card mt-6">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">고객별 미수금 현황</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-medium">고객명</th>
                <th className="text-right p-3 font-medium">총 수주액</th>
                <th className="text-right p-3 font-medium">입금완료액</th>
                <th className="text-right p-3 font-medium">미수금액</th>
                <th className="text-center p-3 font-medium">수금률</th>
                <th className="p-3 font-medium">상태바</th>
              </tr>
            </thead>
            <tbody>
              {customerOutstandingData.map((row: CustomerOutstandingRow) => (
                <tr key={row.customer_name} className="border-b border-border hover:bg-muted/20">
                  <td className="p-3 font-medium">{row.customer_name}</td>
                  <td className="p-3 text-right">{formatAmount(row.total)}</td>
                  <td className="p-3 text-right text-green-600">{formatAmount(row.paid)}</td>
                  <td className="p-3 text-right text-red-600">{formatAmount(row.outstanding)}</td>
                  <td className="p-3 text-center">{row.rate}%</td>
                  <td className="p-3">
                    <RateBar rate={row.rate} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
