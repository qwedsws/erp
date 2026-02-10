'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProfiles } from '@/hooks/admin/useProfiles';
import { PageHeader } from '@/components/common/page-header';
import { useFeedbackToast } from '@/components/common/feedback-toast-provider';
import { UserRole, USER_ROLE_MAP } from '@/types';

export default function NewUserPage() {
  const router = useRouter();
  const { addProfile } = useProfiles();
  const { showError, showSuccess } = useFeedbackToast();
  const [form, setForm] = useState({
    email: '',
    name: '',
    role: 'WORKER' as UserRole,
    department: '',
    phone: '',
    hourly_rate: 0,
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showError('이름을 입력하세요');
      return;
    }
    if (!form.role) {
      showError('역할을 선택하세요');
      return;
    }
    try {
      await addProfile({
        email: form.email,
        name: form.name,
        role: form.role,
        department: form.department || undefined,
        phone: form.phone || undefined,
        hourly_rate: form.hourly_rate || undefined,
        is_active: form.is_active,
      });
      showSuccess('사용자가 등록되었습니다.');
      router.push('/admin/users');
    } catch (err) {
      showError(err instanceof Error ? err.message : '사용자 등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <PageHeader title="사용자 등록" description="새로운 사용자를 등록합니다" />
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">이메일 *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                required
                placeholder="name@company.com"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">이름 *</label>
              <input
                name="name"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                required
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">역할 *</label>
              <select
                value={form.role}
                onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                required
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {(Object.entries(USER_ROLE_MAP) as [UserRole, string][]).map(([role, label]) => (
                  <option key={role} value={role}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">부서</label>
              <input
                name="department"
                value={form.department}
                onChange={(e) => setForm(prev => ({ ...prev, department: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">연락처</label>
              <input
                name="phone"
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="010-0000-0000"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">시급 (원)</label>
              <input
                type="number"
                value={form.hourly_rate}
                onChange={(e) => setForm(prev => ({ ...prev, hourly_rate: Number(e.target.value) }))}
                min={0}
                step={1000}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded border-input"
                />
                <span className="text-sm">활성 상태</span>
              </label>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            저장
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
