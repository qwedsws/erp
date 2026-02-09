'use client';

import React, { useState } from 'react';
import { StatusBadge } from '@/components/common/status-badge';
import {
  Payment,
  PaymentType,
  PaymentMethod,
  PAYMENT_TYPE_MAP,
  PAYMENT_METHOD_MAP,
  PAYMENT_STATUS_MAP,
} from '@/types';
import { Banknote, Plus, Trash2 } from 'lucide-react';

interface PaymentSectionProps {
  orderId: string;
  totalAmount: number;
  payments: Payment[];
  onAddPayment: (data: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) => Promise<Payment>;
  onDeletePayment: (id: string) => Promise<void>;
}

export function PaymentSection({
  orderId,
  totalAmount,
  payments,
  onAddPayment,
  onDeletePayment,
}: PaymentSectionProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    payment_type: 'ADVANCE' as PaymentType,
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'BANK_TRANSFER' as PaymentMethod,
    notes: '',
  });

  const orderPayments = payments
    .filter((p) => p.order_id === orderId)
    .sort((a, b) => a.payment_date.localeCompare(b.payment_date));
  const confirmedTotal = orderPayments
    .filter((p) => p.status === 'CONFIRMED')
    .reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = totalAmount - confirmedTotal;
  const paymentRate =
    totalAmount > 0 ? Math.round((confirmedTotal / totalAmount) * 100) : 0;

  const handleAddPayment = async () => {
    const amount = parseInt(paymentForm.amount);
    if (!amount || amount <= 0) return;
    await onAddPayment({
      order_id: orderId,
      payment_type: paymentForm.payment_type,
      amount,
      payment_date: paymentForm.payment_date,
      payment_method: paymentForm.payment_method,
      status: 'PENDING',
      notes: paymentForm.notes || undefined,
    });
    setPaymentForm({
      payment_type: 'ADVANCE',
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'BANK_TRANSFER',
      notes: '',
    });
    setShowPaymentForm(false);
  };

  if (totalAmount <= 0) return null;

  return (
    <>
      {/* 입금 요약 카드 */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Banknote size={18} className="text-muted-foreground" />
          <h3 className="font-semibold">입금 현황</h3>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">수주금액</p>
            <p className="text-lg font-semibold mt-0.5">
              {totalAmount.toLocaleString()}원
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">입금완료</p>
            <p
              className={`text-lg font-semibold mt-0.5 ${paymentRate === 100 ? 'text-green-600' : paymentRate > 0 ? 'text-blue-600' : ''}`}
            >
              {confirmedTotal.toLocaleString()}원
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">잔여금액</p>
            <p
              className={`text-lg font-semibold mt-0.5 ${remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}
            >
              {remainingAmount.toLocaleString()}원
            </p>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all ${
              paymentRate === 100
                ? 'bg-green-500'
                : paymentRate > 0
                  ? 'bg-blue-500'
                  : 'bg-gray-300'
            }`}
            style={{ width: `${Math.min(paymentRate, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {paymentRate}% 입금
        </p>
      </div>

      {/* 입금 내역 테이블 */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">입금 내역</h3>
          <button
            onClick={() => setShowPaymentForm(!showPaymentForm)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90"
          >
            <Plus size={14} />
            입금 등록
          </button>
        </div>

        {orderPayments.length > 0 ? (
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                    입금일
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                    구분
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                    금액
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                    입금방법
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                    상태
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                    비고
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                    삭제
                  </th>
                </tr>
              </thead>
              <tbody>
                {orderPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-3 py-2">{payment.payment_date}</td>
                    <td className="px-3 py-2">
                      {PAYMENT_TYPE_MAP[payment.payment_type]}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {payment.amount.toLocaleString()}원
                    </td>
                    <td className="px-3 py-2">
                      {PAYMENT_METHOD_MAP[payment.payment_method]}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <StatusBadge
                        status={payment.status}
                        statusMap={PAYMENT_STATUS_MAP}
                      />
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">
                      {payment.notes || '-'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => void onDeletePayment(payment.id)}
                        className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            입금 내역이 없습니다.
          </p>
        )}

        {/* 입금 등록 폼 */}
        {showPaymentForm && (
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-sm font-medium mb-3">입금 등록</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  입금구분
                </label>
                <select
                  value={paymentForm.payment_type}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      payment_type: e.target.value as PaymentType,
                    })
                  }
                  className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {(Object.keys(PAYMENT_TYPE_MAP) as PaymentType[]).map(
                    (key) => (
                      <option key={key} value={key}>
                        {PAYMENT_TYPE_MAP[key]}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  금액 (원)
                </label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, amount: e.target.value })
                  }
                  placeholder="0"
                  className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  입금일
                </label>
                <input
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      payment_date: e.target.value,
                    })
                  }
                  className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  입금방법
                </label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      payment_method: e.target.value as PaymentMethod,
                    })
                  }
                  className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {(Object.keys(PAYMENT_METHOD_MAP) as PaymentMethod[]).map(
                    (key) => (
                      <option key={key} value={key}>
                        {PAYMENT_METHOD_MAP[key]}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  비고
                </label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, notes: e.target.value })
                  }
                  placeholder="비고"
                  className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setShowPaymentForm(false)}
                className="px-3 py-1.5 rounded-md text-xs font-medium border border-border hover:bg-muted"
              >
                취소
              </button>
              <button
                onClick={() => void handleAddPayment()}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90"
              >
                입금 등록
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
