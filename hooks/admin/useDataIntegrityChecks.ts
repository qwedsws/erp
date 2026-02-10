'use client';

import { useMemo } from 'react';
import { useERPStore } from '@/store';

export interface IntegrityMetric {
  label: string;
  total: number;
  issues: number;
  rate: string; // "0.0%" format
}

export interface IntegrityCategory {
  title: string;
  metrics: IntegrityMetric[];
}

export function useDataIntegrityChecks(): IntegrityCategory[] {
  const purchaseRequests = useERPStore((s) => s.purchaseRequests);
  const purchaseOrders = useERPStore((s) => s.purchaseOrders);
  const stockMovements = useERPStore((s) => s.stockMovements);
  const workOrders = useERPStore((s) => s.workOrders);
  const journalEntries = useERPStore((s) => s.journalEntries);
  const projects = useERPStore((s) => s.projects);
  const processSteps = useERPStore((s) => s.processSteps);

  return useMemo(() => {
    // Helper
    const pct = (issues: number, total: number) =>
      total === 0 ? '0.0%' : `${((issues / total) * 100).toFixed(1)}%`;

    // ── 1. project_id 누락률 ──────────────────────────────────────
    const prMissing = purchaseRequests.filter((pr) => !pr.project_id).length;
    const poMissing = purchaseOrders.filter((po) => !po.project_id).length;

    // Stock movements OUT should always have project_id
    const outMovements = stockMovements.filter((m) => m.type === 'OUT');
    const outMissing = outMovements.filter((m) => !m.project_id).length;

    // Work orders should have project_id
    const woMissing = workOrders.filter((wo) => !wo.project_id).length;

    // Journal lines — count lines that lack project_id
    const allLines = journalEntries.flatMap((je) => je.lines || []);
    const linesWithoutProject = allLines.filter((l) => !l.project_id).length;

    const projectIdCategory: IntegrityCategory = {
      title: 'project_id 누락률',
      metrics: [
        {
          label: '구매요청(PR)',
          total: purchaseRequests.length,
          issues: prMissing,
          rate: pct(prMissing, purchaseRequests.length),
        },
        {
          label: '발주(PO)',
          total: purchaseOrders.length,
          issues: poMissing,
          rate: pct(poMissing, purchaseOrders.length),
        },
        {
          label: '출고 이동',
          total: outMovements.length,
          issues: outMissing,
          rate: pct(outMissing, outMovements.length),
        },
        {
          label: '작업지시(WO)',
          total: workOrders.length,
          issues: woMissing,
          rate: pct(woMissing, workOrders.length),
        },
        {
          label: '분개 라인',
          total: allLines.length,
          issues: linesWithoutProject,
          rate: pct(linesWithoutProject, allLines.length),
        },
      ],
    };

    // ── 2. 상태 불일치 ────────────────────────────────────────────
    // Project status vs design process steps
    const lateStatuses = [
      'DESIGN_COMPLETE',
      'MATERIAL_PREP',
      'MACHINING',
      'ASSEMBLING',
      'TRYOUT',
      'REWORK',
      'FINAL_INSPECTION',
      'READY_TO_SHIP',
      'SHIPPED',
      'DELIVERED',
      'AS_SERVICE',
    ];
    let projectStatusMismatch = 0;
    for (const project of projects) {
      const steps = processSteps.filter((s) => s.project_id === project.id);
      const designSteps = steps.filter((s) => s.category === 'DESIGN');
      if (
        designSteps.length > 0 &&
        designSteps.every((s) => s.status === 'COMPLETED')
      ) {
        if (!lateStatuses.includes(project.status)) {
          projectStatusMismatch++;
        }
      }
    }

    // WO vs ProcessStep mismatches
    const woWithStep = workOrders.filter((wo) => wo.process_step_id);
    let woStepMismatch = 0;
    for (const wo of woWithStep) {
      const step = processSteps.find((s) => s.id === wo.process_step_id);
      if (!step) continue;
      if (wo.status === 'COMPLETED' && step.status !== 'COMPLETED')
        woStepMismatch++;
      if (wo.status === 'IN_PROGRESS' && step.status === 'PLANNED')
        woStepMismatch++;
    }

    const statusCategory: IntegrityCategory = {
      title: '상태 불일치',
      metrics: [
        {
          label: '프로젝트 상태 vs 공정',
          total: projects.length,
          issues: projectStatusMismatch,
          rate: pct(projectStatusMismatch, projects.length),
        },
        {
          label: '작업지시 vs 공정단계',
          total: woWithStep.length,
          issues: woStepMismatch,
          rate: pct(woStepMismatch, woWithStep.length),
        },
      ],
    };

    // ── 3. 문서 연결 누락 ─────────────────────────────────────────
    // Converted PRs should have po_id
    const convertedPRs = purchaseRequests.filter(
      (pr) => pr.status === 'CONVERTED',
    );
    const prNoPoId = convertedPRs.filter((pr) => !pr.po_id).length;

    // IN movements should have purchase_order_id (except direct receiving)
    const inMovements = stockMovements.filter((m) => m.type === 'IN');
    const inNoPo = inMovements.filter(
      (m) => !m.purchase_order_id && !m.reason?.includes('직접'),
    ).length;

    // WO should have process_step_id
    const woNoStep = workOrders.filter((wo) => !wo.process_step_id).length;

    const linkCategory: IntegrityCategory = {
      title: '문서 연결 누락',
      metrics: [
        {
          label: 'PR→PO 연결',
          total: convertedPRs.length,
          issues: prNoPoId,
          rate: pct(prNoPoId, convertedPRs.length),
        },
        {
          label: '입고→PO 연결',
          total: inMovements.length,
          issues: inNoPo,
          rate: pct(inNoPo, inMovements.length),
        },
        {
          label: 'WO→공정단계 연결',
          total: workOrders.length,
          issues: woNoStep,
          rate: pct(woNoStep, workOrders.length),
        },
      ],
    };

    return [projectIdCategory, statusCategory, linkCategory];
  }, [
    purchaseRequests,
    purchaseOrders,
    stockMovements,
    workOrders,
    journalEntries,
    projects,
    processSteps,
  ]);
}
