'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCustomers } from '@/hooks/sales/useCustomers';
import { useOrders } from '@/hooks/sales/useOrders';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useFeedbackToast } from '@/components/common/feedback-toast-provider';
import { ORDER_STATUS_MAP } from '@/types';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { customers, deleteCustomer } = useCustomers();
  const { orders } = useOrders();
  const { showError, showSuccess } = useFeedbackToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const customerId = typeof params.id === 'string' ? params.id : params.id?.[0];
  const customer = customers.find(c => c.id === customerId);

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">고객을 찾을 수 없습니다.</p>
        <button onClick={() => router.push('/sales/customers')} className="mt-4 text-primary hover:underline text-sm">
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const customerOrders = orders.filter(o => o.customer_id === customer.id);

  const handleDelete = async () => {
    try {
      await deleteCustomer(customer.id);
      showSuccess('고객이 삭제되었습니다.');
      router.push('/sales/customers');
    } catch (err) {
      showError(err instanceof Error ? err.message : '고객 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.push('/sales/customers')} className="p-1 rounded hover:bg-accent">
          <ArrowLeft size={18} />
        </button>
        <span className="text-sm text-muted-foreground">고객 관리</span>
      </div>
      <PageHeader
        title={customer.name}
        description={customer.business_no || '사업자번호 미등록'}
        actions={
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 px-3 py-2 border border-input rounded-md text-sm hover:bg-accent">
              <Edit size={14} /> 수정
            </button>
            <button onClick={() => setDeleteDialogOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 border border-destructive text-destructive rounded-md text-sm hover:bg-destructive/10">
              <Trash2 size={14} /> 삭제
            </button>
          </div>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">기본 정보</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-muted-foreground">회사명</dt><dd className="font-medium mt-0.5">{customer.name}</dd></div>
              <div><dt className="text-muted-foreground">사업자번호</dt><dd className="font-medium mt-0.5">{customer.business_no || '-'}</dd></div>
              <div><dt className="text-muted-foreground">대표자</dt><dd className="font-medium mt-0.5">{customer.representative || '-'}</dd></div>
              <div><dt className="text-muted-foreground">대표 전화</dt><dd className="font-medium mt-0.5">{customer.phone || '-'}</dd></div>
              <div className="col-span-2"><dt className="text-muted-foreground">주소</dt><dd className="font-medium mt-0.5">{customer.address || '-'}</dd></div>
              <div><dt className="text-muted-foreground">이메일</dt><dd className="font-medium mt-0.5">{customer.email || '-'}</dd></div>
            </dl>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">담당자 정보</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-muted-foreground">담당자명</dt><dd className="font-medium mt-0.5">{customer.contact_person || '-'}</dd></div>
              <div><dt className="text-muted-foreground">담당자 연락처</dt><dd className="font-medium mt-0.5">{customer.contact_phone || '-'}</dd></div>
            </dl>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">거래 이력</h3>
            {customerOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">거래 이력이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {customerOrders.map(order => (
                  <button key={order.id} onClick={() => router.push(`/sales/orders/${order.id}`)} className="w-full text-left p-3 rounded-md border border-border hover:bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-muted-foreground">{order.order_no}</span>
                      <StatusBadge status={order.status} statusMap={ORDER_STATUS_MAP} />
                    </div>
                    <p className="text-sm font-medium mt-1">{order.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.total_amount ? `${(order.total_amount / 10000).toLocaleString()}만원` : ''} | 납기: {order.delivery_date}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
          {customer.notes && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-2">비고</h3>
              <p className="text-sm text-muted-foreground">{customer.notes}</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="고객 삭제"
        description={`'${customer.name}'을(를) 삭제하시겠습니까?`}
        confirmLabel="삭제"
        confirmVariant="destructive"
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
