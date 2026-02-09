'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useProjects } from '@/hooks/projects/useProjects';
import { useProcessSteps } from '@/hooks/projects/useProcessSteps';
import { useProfiles } from '@/hooks/admin/useProfiles';
import { useOrders } from '@/hooks/sales/useOrders';
import { useCustomers } from '@/hooks/sales/useCustomers';
import type {
  Project,
  ProcessStep,
  ProcessStepStatus,
} from '@/domain/shared/entities';

export const DESIGN_PROCESS_OPTIONS = [
  { code: 'DESIGN_3D', name: '3D 모델링', description: '금형 3D 설계 (CAD)' },
  { code: 'DESIGN_2D', name: '2D 도면 작성', description: '가공용 2D 도면 출도' },
  { code: 'DESIGN_REVIEW', name: '설계 검토', description: '설계 검증 및 승인' },
  { code: 'DESIGN_BOM', name: 'BOM 확정', description: '자재 명세 확정 및 구매 연결' },
  { code: 'DESIGN_ANALYSIS', name: '구조 해석', description: 'CAE 구조/유동 해석' },
  { code: 'DESIGN_PROTO', name: '시작품 설계', description: '시작품 설계 및 검증' },
];

export const STEP_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  PLANNED: { label: '대기', color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800', dot: 'bg-gray-400' },
  IN_PROGRESS: { label: '진행중', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950', dot: 'bg-blue-500' },
  COMPLETED: { label: '완료', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950', dot: 'bg-green-500' },
  SKIPPED: { label: '건너뜀', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950', dot: 'bg-orange-400' },
  ON_HOLD: { label: '보류', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950', dot: 'bg-yellow-500' },
};

export interface DesignKpi {
  total: number;
  planned: number;
  inProgress: number;
  completed: number;
  totalEstHours: number;
  completedEstHours: number;
  noStepProjects: number;
}

export interface AddForm {
  code: string;
  hours: string;
}

export function useDesignManageViewModel() {
  const { projects } = useProjects();
  const { processSteps, addProcessStep, deleteProcessStep } = useProcessSteps();
  const { profiles } = useProfiles();
  const { orders } = useOrders();
  const { customers } = useCustomers();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<AddForm>({
    code: DESIGN_PROCESS_OPTIONS[0].code,
    hours: '',
  });

  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );
  const profileById = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile])),
    [profiles],
  );
  const orderById = useMemo(
    () => new Map(orders.map((order) => [order.id, order])),
    [orders],
  );
  const customerById = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer])),
    [customers],
  );

  // --- Computed data ---

  const engineers = useMemo(
    () => profiles.filter(p => p.role === 'ENGINEER' && p.is_active),
    [profiles],
  );

  const designProjects = useMemo(() => {
    const validStatuses = ['CONFIRMED', 'DESIGNING', 'DESIGN_COMPLETE', 'MATERIAL_PREP', 'MACHINING'];
    let filtered = projects.filter(p => validStatuses.includes(p.status));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.project_no.toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [projects, searchQuery]);

  const allDesignSteps = useMemo(
    () => processSteps.filter(s => s.category === 'DESIGN'),
    [processSteps],
  );

  const stepsByProject = useMemo(() => {
    const map = new Map<string, ProcessStep[]>();
    for (const step of allDesignSteps) {
      const existing = map.get(step.project_id);
      if (existing) existing.push(step);
      else map.set(step.project_id, [step]);
    }
    for (const steps of map.values()) {
      steps.sort((a, b) => a.sequence - b.sequence);
    }
    return map;
  }, [allDesignSteps]);

  const kpi = useMemo<DesignKpi>(() => {
    const total = allDesignSteps.length;
    const planned = allDesignSteps.filter(s => s.status === 'PLANNED').length;
    const inProgress = allDesignSteps.filter(s => s.status === 'IN_PROGRESS').length;
    const completed = allDesignSteps.filter(s => s.status === 'COMPLETED').length;
    const totalEstHours = allDesignSteps.reduce((sum, s) => sum + (s.estimated_hours || 0), 0);
    const completedEstHours = allDesignSteps
      .filter(s => s.status === 'COMPLETED')
      .reduce((sum, s) => sum + (s.estimated_hours || 0), 0);
    const noStepProjects = designProjects.filter(p => !(stepsByProject.get(p.id)?.length)).length;
    return { total, planned, inProgress, completed, totalEstHours, completedEstHours, noStepProjects };
  }, [allDesignSteps, designProjects, stepsByProject]);

  // --- Modal data ---

  const selectedProject = useMemo(
    () => (selectedProjectId ? projectById.get(selectedProjectId) ?? null : null),
    [selectedProjectId, projectById],
  );

  const modalSteps = useMemo(
    () => (selectedProjectId ? stepsByProject.get(selectedProjectId) || [] : []),
    [selectedProjectId, stepsByProject],
  );

  // --- Helpers ---

  const getAssigneeName = useCallback(
    (assigneeId?: string) => {
      if (!assigneeId) return null;
      return profileById.get(assigneeId)?.name ?? null;
    },
    [profileById],
  );

  const getCustomerName = useCallback(
    (project: Project) => {
      const order = project.order_id ? orderById.get(project.order_id) : null;
      if (!order) return null;
      return customerById.get(order.customer_id)?.name ?? null;
    },
    [orderById, customerById],
  );

  const getDaysRemaining = useCallback((dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((new Date(dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }, []);

  // --- Actions ---

  const openModal = useCallback(
    (projectId: string) => {
      setSelectedProjectId(projectId);
      setAddForm({ code: DESIGN_PROCESS_OPTIONS[0].code, hours: '' });
    },
    [],
  );

  const closeModal = useCallback(() => {
    setSelectedProjectId(null);
  }, []);

  // ESC key to close modal
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    if (selectedProjectId) {
      document.addEventListener('keydown', onKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedProjectId, closeModal]);

  const handleAdd = useCallback(async () => {
    if (!selectedProjectId) return;
    const option = DESIGN_PROCESS_OPTIONS.find(o => o.code === addForm.code);
    if (!option) return;
    const projectSteps = stepsByProject.get(selectedProjectId) || [];
    const maxSeq = projectSteps.reduce((max, s) => Math.max(max, s.sequence), 0);
    try {
      await addProcessStep({
        project_id: selectedProjectId,
        category: 'DESIGN',
        process_code: option.code,
        process_name: option.name,
        sequence: maxSeq + 1,
        estimated_hours: addForm.hours ? parseFloat(addForm.hours) : undefined,
        status: 'PLANNED' as ProcessStepStatus,
      });
      setAddForm({ code: DESIGN_PROCESS_OPTIONS[0].code, hours: '' });
    } catch {
      // Prevent unhandled rejection
    }
  }, [selectedProjectId, addForm, stepsByProject, addProcessStep]);

  const handleDeleteStep = useCallback(
    (stepId: string) => {
      void deleteProcessStep(stepId).catch(() => {
        // Prevent unhandled rejection
      });
    },
    [deleteProcessStep],
  );

  return {
    // State
    searchQuery,
    setSearchQuery,
    addForm,
    setAddForm,
    selectedProjectId,

    // Computed
    engineers,
    designProjects,
    allDesignSteps,
    stepsByProject,
    kpi,
    selectedProject,
    modalSteps,

    // Helpers
    getAssigneeName,
    getCustomerName,
    getDaysRemaining,

    // Actions
    openModal,
    closeModal,
    handleAdd,
    handleDeleteStep,
  };
}
