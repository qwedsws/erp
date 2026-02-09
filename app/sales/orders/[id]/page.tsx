'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCustomers } from '@/hooks/sales/useCustomers';
import { useOrders } from '@/hooks/sales/useOrders';
import { usePayments } from '@/hooks/sales/usePayments';
import { useProjects } from '@/hooks/projects/useProjects';
import { PageHeader } from '@/components/common/page-header';
import { StatusBadge } from '@/components/common/status-badge';
import { ORDER_STATUS_MAP, PROJECT_STATUS_MAP } from '@/types';
import { ArrowLeft } from 'lucide-react';
import { OrderSummarySection } from './_components/order-summary-section';
import { PaymentSection } from './_components/payment-section';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { orders, updateOrder, createProjectFromOrder } = useOrders();
  const { customers } = useCustomers();
  const { projects } = useProjects();
  const { payments, addPayment, deletePayment } = usePayments();
  const orderId = typeof params.id === 'string' ? params.id : params.id?.[0];
  const order = orders.find(o => o.id === orderId);

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">수주를 찾을 수 없습니다.</p>
        <button onClick={() => router.push('/sales/orders')} className="mt-4 text-primary hover:underline text-sm">목록으로 돌아가기</button>
      </div>
    );
  }

  const customer = customers.find(c => c.id === order.customer_id);
  const relatedProjects = projects.filter(p => p.order_id === order.id);
  const totalAmount = order.total_amount || 0;

  const handleCreateProject = async () => {
    try {
      await createProjectFromOrder({
        order: {
          id: order.id,
          title: order.title,
          delivery_date: order.delivery_date,
        },
        mold_type: 'INJECTION',
        priority: 'MEDIUM',
        description: order.notes,
      });
    } catch {
      // Error handling is done at the domain layer
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.push('/sales/orders')} className="p-1 rounded hover:bg-accent"><ArrowLeft size={18} /></button>
        <span className="text-sm text-muted-foreground">수주 관리</span>
      </div>
      <PageHeader
        title={order.title}
        description={`${order.order_no} | ${customer?.name || ''}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} statusMap={ORDER_STATUS_MAP} />
            {order.status === 'CONFIRMED' && (
              <button onClick={() => void updateOrder(order.id, { status: 'IN_PROGRESS' })} className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90">
                진행 시작
              </button>
            )}
          </div>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <OrderSummarySection
            order={order}
            customerName={customer?.name || ''}
          />

          <PaymentSection
            orderId={order.id}
            totalAmount={totalAmount}
            payments={payments}
            onAddPayment={addPayment}
            onDeletePayment={deletePayment}
          />
        </div>
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">연결 프로젝트</h3>
              {relatedProjects.length === 0 && (
                <button onClick={() => void handleCreateProject()} className="text-xs text-primary hover:underline">+ 프로젝트 생성</button>
              )}
            </div>
            {relatedProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">연결된 프로젝트가 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {relatedProjects.map(pj => (
                  <Link key={pj.id} href={`/projects/${pj.id}`} className="block p-3 rounded-md border border-border hover:bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-muted-foreground">{pj.project_no}</span>
                      <StatusBadge status={pj.status} statusMap={PROJECT_STATUS_MAP} />
                    </div>
                    <p className="text-sm font-medium mt-1">{pj.name}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
