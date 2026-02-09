'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/common/page-header';
import { useFeedbackToast } from '@/components/common/feedback-toast-provider';
import { SUPPLIER_TYPE_MAP } from '@/types';
import { ArrowLeft } from 'lucide-react';
import { useSuppliers } from '@/hooks/procurement/useSuppliers';

export default function NewSupplierPage() {
  const router = useRouter();
  const { addSupplier } = useSuppliers();
  const { showError, showSuccess } = useFeedbackToast();

  const [form, setForm] = useState({
    name: '',
    business_no: '',
    supplier_type: '' as '' | 'MATERIAL' | 'OUTSOURCE' | 'BOTH',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showError('업체명을 입력하세요');
      return;
    }
    try {
      await addSupplier({
        name: form.name,
        business_no: form.business_no || undefined,
        supplier_type: form.supplier_type || undefined,
        contact_person: form.contact_person || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        notes: form.notes || undefined,
      });
      showSuccess('거래처가 등록되었습니다.');
      router.push('/materials/suppliers');
    } catch (err) {
      showError(err instanceof Error ? err.message : '거래처 등록 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.push('/materials/suppliers')} className="p-1 rounded hover:bg-accent">
          <ArrowLeft size={18} />
        </button>
        <span className="text-sm text-muted-foreground">거래처 관리</span>
      </div>
      <PageHeader title="거래처 등록" description="새로운 거래처를 등록합니다" />
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">업체명 *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="예: (주)대한금속"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">사업자번호</label>
              <input
                name="business_no"
                value={form.business_no}
                onChange={handleChange}
                placeholder="예: 123-45-67890"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">업체 유형</label>
              <select
                name="supplier_type"
                value={form.supplier_type}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">선택하세요</option>
                {(Object.entries(SUPPLIER_TYPE_MAP) as [string, string][]).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">담당자</label>
              <input
                name="contact_person"
                value={form.contact_person}
                onChange={handleChange}
                placeholder="예: 김철수"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">연락처</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="예: 031-123-4567"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">이메일</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="예: info@example.com"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">주소</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="예: 경기도 화성시 동탄로 123"
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">비고</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">
            저장
          </button>
          <button type="button" onClick={() => router.push('/materials/suppliers')} className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent">
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
