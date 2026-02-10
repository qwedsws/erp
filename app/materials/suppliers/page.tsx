'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSuppliers } from '@/hooks/procurement/useSuppliers';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/common/data-table';
import { Supplier, SUPPLIER_TYPE_MAP } from '@/types';
import { Plus, Building2 } from 'lucide-react';

export default function SuppliersPage() {
  const router = useRouter();
  const { suppliers } = useSuppliers();

  const columns = [
    {
      key: 'name',
      header: '업체명',
      sortable: true,
      cell: (item: Supplier) => (
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-muted-foreground shrink-0" />
          <span className="font-medium">{item.name}</span>
        </div>
      ),
    },
    {
      key: 'business_no',
      header: '사업자번호',
      cell: (item: Supplier) => item.business_no || '-',
    },
    {
      key: 'supplier_type',
      header: '유형',
      sortable: true,
      cell: (item: Supplier) =>
        item.supplier_type ? SUPPLIER_TYPE_MAP[item.supplier_type] || item.supplier_type : '-',
    },
    {
      key: 'contact_person',
      header: '담당자',
      cell: (item: Supplier) => item.contact_person || '-',
    },
    {
      key: 'phone',
      header: '연락처',
      cell: (item: Supplier) => item.phone || '-',
    },
    {
      key: 'email',
      header: '이메일',
      cell: (item: Supplier) => item.email || '-',
    },
  ];

  return (
    <div>
      <PageHeader
        title="거래처 관리"
        description="공급업체 정보를 관리합니다"
        actions={
          <Link
            href="/materials/suppliers/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            <Plus size={16} />
            거래처 등록
          </Link>
        }
      />

      <DataTable
        data={suppliers}
        columns={columns}
        searchPlaceholder="업체명 검색..."
        searchKeys={['name']}
        onRowClick={(item) => router.push(`/materials/suppliers/${item.id}`)}
      />
    </div>
  );
}
