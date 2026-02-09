'use client';

import React, { useMemo } from 'react';
import { useProfiles } from '@/hooks/admin/useProfiles';
import { PageHeader } from '@/components/common/page-header';
import { UserRole, USER_ROLE_MAP } from '@/types';
import { Shield, Users } from 'lucide-react';

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ADMIN: '시스템 전체 관리, 사용자 관리, 설정 변경',
  SALES: '고객 관리, 견적/수주 등록 및 관리',
  ENGINEER: '설계 공정 관리, BOM 관리, 도면 관리',
  PRODUCTION: '공정 계획, 작업 지시, 스케줄 관리',
  WORKER: '작업 실적 입력, 작업 지시 확인',
  PURCHASE: '자재/구매 관리, 발주, 입고 관리',
  QC: '품질 검사, 트라이아웃, 불량 관리',
  ACCOUNTING: '매출/매입 관리, 원가 관리, 정산',
};

export default function RolesPage() {
  const { profiles } = useProfiles();

  const roleData = useMemo(() => {
    return (Object.entries(USER_ROLE_MAP) as [UserRole, string][]).map(([role, label]) => {
      const usersWithRole = profiles.filter(p => p.role === role);
      return {
        role,
        label,
        description: ROLE_DESCRIPTIONS[role],
        count: usersWithRole.length,
        users: usersWithRole,
      };
    });
  }, [profiles]);

  return (
    <div>
      <PageHeader
        title="역할/권한 관리"
        description="시스템 역할별 권한과 배정된 사용자를 확인합니다"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roleData.map(({ role, label, description, count, users }) => (
          <div key={role} className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Shield size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{label}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users size={14} />
                  <span className="text-sm font-medium">{count}명</span>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">권한 설명</p>
                <p className="text-sm">{description}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">배정된 사용자</p>
                {users.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {users.map(user => (
                      <span
                        key={user.id}
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.is_active
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}
                      >
                        {user.name}
                        {!user.is_active && ' (비활성)'}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">배정된 사용자가 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
