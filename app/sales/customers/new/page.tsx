'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomers } from '@/hooks/sales/useCustomers';
import { PageHeader } from '@/components/common/page-header';
import { useFeedbackToast } from '@/components/common/feedback-toast-provider';

export default function NewCustomerPage() {
  const router = useRouter();
  const { addCustomer } = useCustomers();
  const { showError, showSuccess } = useFeedbackToast();
  const [form, setForm] = useState({
    name: '',
    business_no: '',
    representative: '',
    address: '',
    phone: '',
    email: '',
    contact_person: '',
    contact_phone: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showError('회사명을 입력하세요');
      return;
    }
    try {
      await addCustomer(form);
      showSuccess('고객사가 등록되었습니다.');
      router.push('/sales/customers');
    } catch (err) {
      showError(err instanceof Error ? err.message : '고객 등록 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div>
      <PageHeader title="고객 등록" description="새로운 거래처를 등록합니다" />
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">회사명 *</label>
              <input name="name" value={form.name} onChange={handleChange} required className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">사업자번호</label>
              <input name="business_no" value={form.business_no} onChange={handleChange} placeholder="000-00-00000" className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">대표자</label>
              <input name="representative" value={form.representative} onChange={handleChange} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">대표 전화</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">주소</label>
            <input name="address" value={form.address} onChange={handleChange} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">이메일</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold mb-3">담당자 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">담당자명</label>
                <input name="contact_person" value={form.contact_person} onChange={handleChange} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">담당자 연락처</label>
                <input name="contact_phone" value={form.contact_phone} onChange={handleChange} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">비고</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">
            저장
          </button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent">
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
