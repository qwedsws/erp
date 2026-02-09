'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/projects/useProjects';
import { useOrders } from '@/hooks/sales/useOrders';
import { PageHeader } from '@/components/common/page-header';
import { useFeedbackToast } from '@/components/common/feedback-toast-provider';
import { MoldType, Priority } from '@/types';

export default function NewProjectPage() {
  const router = useRouter();
  const { orders } = useOrders();
  const { addProject } = useProjects();
  const { showError, showSuccess } = useFeedbackToast();
  const [form, setForm] = useState({
    order_id: '',
    name: '',
    mold_type: 'INJECTION' as MoldType,
    priority: 'MEDIUM' as Priority,
    due_date: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.due_date) {
      showError('필수 항목을 입력하세요');
      return;
    }
    try {
      await addProject({
        order_id: form.order_id || undefined,
        name: form.name,
        mold_type: form.mold_type,
        status: 'CONFIRMED',
        priority: form.priority,
        due_date: form.due_date,
        description: form.description || undefined,
      });
      showSuccess('프로젝트가 생성되었습니다.');
      router.push('/projects');
    } catch (err) {
      showError(err instanceof Error ? err.message : '프로젝트 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <PageHeader title="프로젝트 생성" description="새로운 금형 프로젝트를 생성합니다" />
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">연결 수주</label>
            <select value={form.order_id} onChange={(e) => setForm(prev => ({ ...prev, order_id: e.target.value }))} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">선택 없음 (직접 생성)</option>
              {orders.filter(o => o.status !== 'CANCELLED').map(o => (
                <option key={o.id} value={o.id}>{o.order_no} - {o.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">프로젝트명 *</label>
            <input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} required className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">금형 종류 *</label>
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
            <div>
              <label className="block text-sm font-medium mb-1.5">납기일 *</label>
              <input type="date" value={form.due_date} onChange={(e) => setForm(prev => ({ ...prev, due_date: e.target.value }))} required className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">설명</label>
            <textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">생성</button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent">취소</button>
        </div>
      </form>
    </div>
  );
}
