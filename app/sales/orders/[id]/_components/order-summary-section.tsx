'use client';

import React from 'react';
import { Order } from '@/types';

interface OrderSummarySectionProps {
  order: Order;
  customerName: string;
}

export function OrderSummarySection({
  order,
  customerName,
}: OrderSummarySectionProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="font-semibold mb-4">수주 정보</h3>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-muted-foreground">수주번호</dt>
          <dd className="font-medium font-mono mt-0.5">{order.order_no}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">고객사</dt>
          <dd className="font-medium mt-0.5">{customerName || '-'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">수주일</dt>
          <dd className="font-medium mt-0.5">{order.order_date}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">납기일</dt>
          <dd className="font-medium mt-0.5">{order.delivery_date}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">수주 금액</dt>
          <dd className="font-medium mt-0.5">
            {order.total_amount
              ? `${order.total_amount.toLocaleString()}원`
              : '-'}
          </dd>
        </div>
      </dl>
      {order.notes && (
        <div className="mt-4 pt-4 border-t border-border">
          <dt className="text-sm text-muted-foreground">비고</dt>
          <dd className="text-sm mt-1">{order.notes}</dd>
        </div>
      )}
    </div>
  );
}
