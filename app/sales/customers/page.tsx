'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCustomers } from '@/hooks/sales/useCustomers';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/common/data-table';
import { Customer } from '@/types';
import { Plus, Building2 } from 'lucide-react';

export default function CustomersPage() {
  const router = useRouter();
  const { customers } = useCustomers();

  const columns = [
    { key: 'name', header: '회사명', sortable: true, cell: (item: Customer) => (
      <div className="flex items-center gap-2">
        <Building2 size={16} className="text-muted-foreground shrink-0" />
        <span className="font-medium">{item.name}</span>
      </div>
    )},
    { key: 'business_no', header: '사업자번호' },
    { key: 'contact_person', header: '담당자' },
    { key: 'contact_phone', header: '연락처' },
    { key: 'email', header: '이메일' },
    { key: 'created_at', header: '등록일', sortable: true, cell: (item: Customer) => (
      new Date(item.created_at).toLocaleDateString('ko-KR')
    )},
  ];

  return (
    <div>
      <PageHeader
        title="고객 관리"
        description="거래처 정보를 관리합니다"
        actions={
          <Link
            href="/sales/customers/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            <Plus size={16} />
            고객 등록
          </Link>
        }
      />
      <DataTable
        data={customers}
        columns={columns}
        searchPlaceholder="회사명, 담당자 검색..."
        searchKeys={['name', 'contact_person']}
        onRowClick={(item) => router.push(`/sales/customers/${item.id}`)}
      />
    </div>
  );
}
