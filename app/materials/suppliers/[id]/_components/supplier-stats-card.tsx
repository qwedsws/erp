'use client';

interface SupplierStatsCardProps {
  stats: {
    totalOrders: number;
    totalAmount: number;
    receivedCount: number;
  };
}

export function SupplierStatsCard({ stats }: SupplierStatsCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="font-semibold mb-4">거래 통계</h3>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">총 발주 건수</dt>
          <dd className="font-bold">{stats.totalOrders}건</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">총 발주 금액</dt>
          <dd className="font-bold">{stats.totalAmount.toLocaleString()}원</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">입고 완료 건수</dt>
          <dd className="font-bold">{stats.receivedCount}건</dd>
        </div>
      </dl>
    </div>
  );
}
