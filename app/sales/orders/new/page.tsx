'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomers } from '@/hooks/sales/useCustomers';
import { useOrders } from '@/hooks/sales/useOrders';
import { PageHeader } from '@/components/common/page-header';
import { useFeedbackToast } from '@/components/common/feedback-toast-provider';
import { MoldType, Priority } from '@/types';

export default function NewOrderPage() {
  const router = useRouter();
  const { customers } = useCustomers();
  const { createOrderWithProject } = useOrders();
  const { showError, showSuccess } = useFeedbackToast();
  const [form, setForm] = useState({
    customer_id: '',
    title: '',
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    total_amount: '',
    mold_type: 'INJECTION' as MoldType,
    priority: 'MEDIUM' as Priority,
    notes: '',
    createProject: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id || !form.title || !form.delivery_date) {
      showError('필수 항목을 입력하세요');
      return;
    }
    try {
      await createOrderWithProject({
        customer_id: form.customer_id,
        title: form.title,
        order_date: form.order_date,
        delivery_date: form.delivery_date,
        total_amount: form.total_amount ? Number(form.total_amount) : undefined,
        notes: form.notes || undefined,
        createProject: form.createProject,
        mold_type: form.mold_type,
        priority: form.priority,
      });
      showSuccess('수주가 등록되었습니다.');
      router.push('/sales/orders');
    } catch (err) {
      showError(err instanceof Error ? err.message : '수주 등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <PageHeader title="수주 등록" description="새로운 수주를 등록합니다" />
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">고객사 *</label>
            <select
              value={form.customer_id}
              onChange={(e) => setForm(prev => ({ ...prev, customer_id: e.target.value }))}
              required
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">선택하세요</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">수주 제목 *</label>
            <input
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              required
              placeholder="예: 커넥터 하우징 사출금형"
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">수주일 *</label>
              <input type="date" value={form.order_date} onChange={(e) => setForm(prev => ({ ...prev, order_date: e.target.value }))} required className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">납기일 *</label>
              <input type="date" value={form.delivery_date} onChange={(e) => setForm(prev => ({ ...prev, delivery_date: e.target.value }))} required className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">금액 (원)</label>
              <input type="number" value={form.total_amount} onChange={(e) => setForm(prev => ({ ...prev, total_amount: e.target.value }))} placeholder="0" className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">금형 종류</label>
              <select value={form.mold_type} onChange={(e) => setForm(prev => ({ ...prev, mold_type: e.target.value as MoldType }))} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="INJECTION">사출금형</option>
                <option value="PRESS">프레스금형</option>
                <option value="DIE_CASTING">다이캐스팅금형</option>
                <option value="BLOW">블로우금형</option>
                <option value="OTHER">기타</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">우선순위</label>
              <select value={form.priority} onChange={(e) => setForm(prev => ({ ...prev, priority: e.target.value as Priority }))} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="HIGH">긴급</option>
                <option value="MEDIUM">보통</option>
                <option value="LOW">낮음</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">비고</label>
            <textarea value={form.notes} onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="createProject" checked={form.createProject} onChange={(e) => setForm(prev => ({ ...prev, createProject: e.target.checked }))} className="rounded" />
            <label htmlFor="createProject" className="text-sm">프로젝트 자동 생성</label>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">저장</button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent">취소</button>
        </div>
      </form>
    </div>
  );
}
