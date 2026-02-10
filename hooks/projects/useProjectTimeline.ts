'use client';

import { useMemo } from 'react';
import { useERPStore } from '@/store';

export interface TimelineEvent {
  date: string;
  category: '수주' | '설계' | '구매' | '생산';
  title: string;
  description?: string;
}

export function useProjectTimeline(projectId: string | undefined): TimelineEvent[] {
  const orders = useERPStore((s) => s.orders);
  const projects = useERPStore((s) => s.projects);
  const processSteps = useERPStore((s) => s.processSteps);
  const purchaseOrders = useERPStore((s) => s.purchaseOrders);
  const purchaseRequests = useERPStore((s) => s.purchaseRequests);
  const workOrders = useERPStore((s) => s.workOrders);

  return useMemo(() => {
    if (!projectId) return [];
    const events: TimelineEvent[] = [];

    // 1. 수주 확정
    const project = projects.find((p) => p.id === projectId);
    if (project?.order_id) {
      const order = orders.find((o) => o.id === project.order_id);
      if (order) {
        events.push({
          date: order.order_date,
          category: '수주',
          title: `수주 확정 (${order.order_no})`,
          description: order.title,
        });
      }
    }

    // 2. 설계 공정 이력
    const steps = processSteps.filter((s) => s.project_id === projectId);
    for (const step of steps) {
      if (step.category === 'DESIGN' && step.status === 'IN_PROGRESS' && step.start_date) {
        events.push({
          date: step.start_date,
          category: '설계',
          title: `${step.process_name} 시작`,
        });
      }
      if (step.category === 'DESIGN' && step.status === 'COMPLETED' && step.end_date) {
        events.push({
          date: step.end_date,
          category: '설계',
          title: `${step.process_name} 완료`,
        });
      }
    }

    // 3. 구매요청/발주
    const prs = purchaseRequests.filter((pr) => pr.project_id === projectId);
    if (prs.length > 0) {
      const sorted = [...prs].sort((a, b) => a.created_at.localeCompare(b.created_at));
      events.push({
        date: sorted[0].created_at.split('T')[0],
        category: '구매',
        title: `구매요청 ${prs.length}건 등록`,
      });
    }

    const pos = purchaseOrders.filter((po) => po.project_id === projectId);
    for (const po of pos) {
      events.push({
        date: po.order_date,
        category: '구매',
        title: `발주 (${po.po_no})`,
        description: `${po.items.length}개 품목`,
      });
    }

    // 4. 생산 작업지시
    const wos = workOrders.filter((wo) => wo.project_id === projectId);
    for (const wo of wos) {
      if (wo.actual_start) {
        events.push({
          date: wo.actual_start.split('T')[0],
          category: '생산',
          title: `작업 시작 (${wo.work_order_no})`,
        });
      }
      if (wo.status === 'COMPLETED' && wo.actual_end) {
        events.push({
          date: wo.actual_end.split('T')[0],
          category: '생산',
          title: `작업 완료 (${wo.work_order_no})`,
        });
      }
    }

    // Sort by date ascending
    events.sort((a, b) => a.date.localeCompare(b.date));
    return events;
  }, [projectId, orders, projects, processSteps, purchaseOrders, purchaseRequests, workOrders]);
}
