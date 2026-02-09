'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSuppliers } from '@/hooks/procurement/useSuppliers';
import { PageHeader } from '@/components/common/page-header';
import { DataTable } from '@/components/common/data-table';
import { Supplier, SUPPLIER_TYPE_MAP } from '@/types';
import { Plus, Building2, Package, Truck } from 'lucide-react';

export default function SuppliersPage() {
  const router = useRouter();
  const { suppliers } = useSuppliers();

  const stats = useMemo(() => {
    const total = suppliers.length;
    const materialCount = suppliers.filter(
      s => s.supplier_type === 'MATERIAL' || s.supplier_type === 'BOTH'
    ).length;
    const outsourceCount = suppliers.filter(
      s => s.supplier_type === 'OUTSOURCE' || s.supplier_type === 'BOTH'
    ).length;
    return { total, materialCount, outsourceCount };
  }, [suppliers]);

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

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Building2 size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">총 거래처 수</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <Package size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">자재 공급처</p>
              <p className="text-2xl font-bold">{stats.materialCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <Truck size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">외주 공급처</p>
              <p className="text-2xl font-bold">{stats.outsourceCount}</p>
            </div>
          </div>
        </div>
      </div>

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
