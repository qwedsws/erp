'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/projects/useProjects';
import { useOrders } from '@/hooks/sales/useOrders';
import { useFeedbackToast } from '@/hooks/shared/useFeedbackToast';
import type { MoldType, Priority } from '@/domain/shared/entities';

export interface ProjectRow {
  order_id: string;
  name: string;
  mold_type: MoldType;
  priority: Priority;
  due_date: string;
  description: string;
}

function emptyRow(): ProjectRow {
  return {
    order_id: '',
    name: '',
    mold_type: 'INJECTION',
    priority: 'MEDIUM',
    due_date: '',
    description: '',
  };
}

export function useProjectForm() {
  const router = useRouter();
  const { orders } = useOrders();
  const { addProject } = useProjects();
  const { showError, showSuccess } = useFeedbackToast();

  const [rows, setRows] = useState<ProjectRow[]>([emptyRow()]);
  const [isLoading, setIsLoading] = useState(false);

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== 'CANCELLED'),
    [orders],
  );

  const validRows = useMemo(
    () => rows.filter((r) => r.name.trim() && r.due_date),
    [rows],
  );

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof ProjectRow, value: string) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validRows.length === 0) {
      showError('최소 1개 이상의 프로젝트를 입력하세요. (프로젝트명 + 납기일 필수)');
      return;
    }

    setIsLoading(true);
    try {
      const results = await Promise.all(
        validRows.map((row) =>
          addProject({
            order_id: row.order_id || undefined,
            name: row.name,
            mold_type: row.mold_type,
            status: 'CONFIRMED',
            priority: row.priority,
            due_date: row.due_date,
            description: row.description || undefined,
          }),
        ),
      );
      showSuccess(`${results.length}건의 프로젝트가 생성되었습니다.`);
      router.push('/projects');
    } catch (err) {
      showError(err instanceof Error ? err.message : '프로젝트 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    rows,
    activeOrders,
    validRowCount: validRows.length,
    addRow,
    removeRow,
    updateRow,
    handleSubmit,
    isLoading,
  };
}
