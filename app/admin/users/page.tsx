'use client';

import React, { useState, useMemo } from 'react';
import { useProfiles } from '@/hooks/admin/useProfiles';
import { PageHeader } from '@/components/common/page-header';
import { useFeedbackToast } from '@/components/common/feedback-toast-provider';
import { UserRole, USER_ROLE_MAP } from '@/types';
import { Users, UserCheck, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';

export default function UsersPage() {
  const { profiles, updateProfile } = useProfiles();
  const { showError } = useFeedbackToast();
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return profiles
      .filter(p => roleFilter === 'ALL' || p.role === roleFilter)
      .filter(p => {
        if (!search) return true;
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.email ?? '').toLowerCase().includes(q);
      });
  }, [profiles, roleFilter, search]);

  const totalUsers = profiles.length;
  const activeUsers = profiles.filter(p => p.is_active).length;
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const role of Object.keys(USER_ROLE_MAP)) {
      counts[role] = profiles.filter(p => p.role === role).length;
    }
    return counts;
  }, [profiles]);

  return (
    <div>
      <PageHeader
        title="사용자 관리"
        description="시스템 사용자 계정을 관리합니다. 계정은 Supabase Auth에서 생성됩니다."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-blue-50">
            <Users size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">전체 사용자</p>
            <p className="text-2xl font-bold">{totalUsers}<span className="text-sm font-normal text-muted-foreground ml-1">명</span></p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-green-50">
            <UserCheck size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">활성 사용자</p>
            <p className="text-2xl font-bold text-green-600">{activeUsers}<span className="text-sm font-normal text-muted-foreground ml-1">명</span></p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-2">역할별 현황</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {Object.entries(USER_ROLE_MAP).map(([role, label]) => (
              <span key={role} className="text-muted-foreground">
                {label} <span className="font-semibold text-foreground">{roleCounts[role]}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1 text-sm">
          <Filter size={14} className="text-muted-foreground" />
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              roleFilter === 'ALL' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            전체
          </button>
          {(Object.entries(USER_ROLE_MAP) as [UserRole, string][]).map(([role, label]) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                roleFilter === role ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="이름, 이메일 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-56 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">이름</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">이메일</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">역할</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">부서</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">연락처</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">시급</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">상태</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">등록일</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(profile => (
              <React.Fragment key={profile.id}>
                <tr
                  className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/30"
                  onClick={() => setExpandedId(expandedId === profile.id ? null : profile.id)}
                >
                  <td className="px-4 py-3 font-medium">{profile.name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{profile.email ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                      {USER_ROLE_MAP[profile.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{profile.department || '-'}</td>
                  <td className="px-4 py-3 text-xs">{profile.phone || '-'}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {profile.hourly_rate ? `${profile.hourly_rate.toLocaleString()}원` : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${profile.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(profile.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3">
                    {expandedId === profile.id ? (
                      <ChevronUp size={14} className="text-muted-foreground" />
                    ) : (
                      <ChevronDown size={14} className="text-muted-foreground" />
                    )}
                  </td>
                </tr>
                {expandedId === profile.id && (
                  <tr className="border-b border-border">
                    <td colSpan={9} className="p-0">
                      <InlineEditForm
                        profile={profile}
                        onSave={(data) => {
                          void updateProfile(profile.id, data).catch((err) => {
                            showError(err instanceof Error ? err.message : '사용자 정보 저장 중 오류가 발생했습니다.');
                          });
                          setExpandedId(null);
                        }}
                        onValidationError={showError}
                        onCancel={() => setExpandedId(null)}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  사용자가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">총 {filtered.length}건</div>
    </div>
  );
}

function InlineEditForm({
  profile,
  onSave,
  onValidationError,
  onCancel,
}: {
  profile: { id: string; name: string; role: UserRole; department?: string; phone?: string; hourly_rate?: number; is_active: boolean };
  onSave: (data: Partial<typeof profile>) => void;
  onValidationError: (message: string) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: profile.name,
    role: profile.role as UserRole,
    department: profile.department || '',
    phone: profile.phone || '',
    hourly_rate: profile.hourly_rate ?? 0,
    is_active: profile.is_active,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      onValidationError('이름을 입력하세요');
      return;
    }
    onSave({
      name: form.name,
      role: form.role,
      department: form.department || undefined,
      phone: form.phone || undefined,
      hourly_rate: form.hourly_rate || undefined,
      is_active: form.is_active,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-muted/20 px-6 py-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1.5 text-muted-foreground">이름 *</label>
          <input
            value={form.name}
            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
            required
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5 text-muted-foreground">역할 *</label>
          <select
            value={form.role}
            onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {(Object.entries(USER_ROLE_MAP) as [UserRole, string][]).map(([role, label]) => (
              <option key={role} value={role}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5 text-muted-foreground">부서</label>
          <input
            value={form.department}
            onChange={(e) => setForm(prev => ({ ...prev, department: e.target.value }))}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5 text-muted-foreground">연락처</label>
          <input
            value={form.phone}
            onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="010-0000-0000"
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5 text-muted-foreground">시급 (원)</label>
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
      <div className="flex items-center gap-3 mt-4">
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
        >
          저장
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent"
        >
          취소
        </button>
      </div>
    </form>
  );
}
