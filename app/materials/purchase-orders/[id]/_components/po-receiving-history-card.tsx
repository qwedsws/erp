'use client';

import React from 'react';
import type { StockMovement, Material } from '@/types';

export interface POReceivingHistoryCardProps {
  receivingHistory: StockMovement[];
  materialById: Map<string, Material>;
}

export function POReceivingHistoryCard({ receivingHistory, materialById }: POReceivingHistoryCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="font-semibold mb-4">입고 이력</h3>
      {receivingHistory.length > 0 ? (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">일시</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">자재명</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">수량</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">단가</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">금액</th>
              </tr>
            </thead>
            <tbody>
              {receivingHistory.map((sm) => {
                const mat = materialById.get(sm.material_id);
                const amount = sm.quantity * (sm.unit_price || 0);
                return (
                  <tr key={sm.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{sm.created_at.split('T')[0]}</td>
                    <td className="px-4 py-3 font-medium">{mat?.name || '-'}</td>
                    <td className="px-4 py-3 text-right">{sm.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{sm.unit_price ? `${sm.unit_price.toLocaleString()}원` : '-'}</td>
                    <td className="px-4 py-3 text-right font-medium">{amount > 0 ? `${amount.toLocaleString()}원` : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">입고 이력이 없습니다.</p>
      )}
    </div>
  );
}
