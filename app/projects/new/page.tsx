'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { SearchSelect } from '@/components/common/search-select';
import { DatePickerCell } from '@/components/common/date-picker-cell';
import { useProjectForm } from '@/hooks/projects/useProjectForm';
import type { MoldType, Priority } from '@/domain/shared/entities';

const cellInput =
  'w-full h-8 px-2 rounded border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring';

const MOLD_TYPE_OPTIONS: { value: MoldType; label: string }[] = [
  { value: 'INJECTION', label: '사출금형' },
  { value: 'PRESS', label: '프레스금형' },
  { value: 'DIE_CASTING', label: '다이캐스팅금형' },
  { value: 'BLOW', label: '블로우금형' },
  { value: 'OTHER', label: '기타' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'HIGH', label: '긴급' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'LOW', label: '낮음' },
];

export default function NewProjectPage() {
  const {
    rows,
    activeOrders,
    validRowCount,
    addRow,
    removeRow,
    updateRow,
    handleSubmit,
    isLoading,
  } = useProjectForm();

  const orderOptions = useMemo(
    () =>
      activeOrders.map((o) => ({
        value: o.id,
        label: `${o.order_no} - ${o.title}`,
        searchText: `${o.order_no} ${o.title}`,
      })),
    [activeOrders],
  );

  // 마지막 행에 프로젝트명 입력 시 자동 빈 행 추가
  const handleNameChange = (index: number, value: string) => {
    updateRow(index, 'name', value);
    if (value && index === rows.length - 1) {
      addRow();
    }
  };

  const handleRowKeyDown = (e: React.KeyboardEvent, rowIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (rowIndex === rows.length - 1) {
        addRow();
      }
      setTimeout(() => {
        const nextInput = document.querySelector<HTMLInputElement>(
          `[data-row="${rowIndex + 1}"] td:nth-child(3) input`,
        );
        nextInput?.focus();
      }, 0);
    }
  };

  return (
    <div>
      {/* Back navigation */}
      <div className="flex items-center gap-2 mb-4">
        <Link href="/projects" className="p-1 rounded hover:bg-accent">
          <ArrowLeft size={18} />
        </Link>
        <span className="text-sm text-muted-foreground">프로젝트</span>
      </div>

      <PageHeader
        title="프로젝트 생성 (일괄)"
        description="여러 금형 프로젝트를 한 번에 생성합니다"
      />

      <form onSubmit={(e) => void handleSubmit(e)}>
        {/* Grid table */}
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">프로젝트 목록</h3>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-input hover:bg-accent transition-colors"
            >
              <Plus size={14} />
              행 추가
            </button>
          </div>

          <div className="overflow-x-auto min-h-[320px]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-2 py-2 text-center font-medium text-muted-foreground w-10">#</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground min-w-[180px]">연결 수주</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground min-w-[200px]">
                    프로젝트명 <span className="text-destructive">*</span>
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground min-w-[120px]">금형종류</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground w-24">우선순위</th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground w-32">
                    납기일 <span className="text-destructive">*</span>
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-muted-foreground min-w-[160px]">설명</th>
                  <th className="px-2 py-2 text-center font-medium text-muted-foreground w-10"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={index}
                    data-row={index}
                    className="border-b border-border last:border-0 align-top"
                  >
                    {/* # */}
                    <td className="px-2 py-2 text-center text-muted-foreground">{index + 1}</td>

                    {/* 연결 수주 */}
                    <td className="px-2 py-2">
                      <SearchSelect
                        options={orderOptions}
                        value={row.order_id}
                        onChange={(val) => updateRow(index, 'order_id', val)}
                        placeholder="수주 검색"
                        compact
                      />
                    </td>

                    {/* 프로젝트명 */}
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => handleNameChange(index, e.target.value)}
                        placeholder="프로젝트명 입력"
                        className={cellInput}
                      />
                    </td>

                    {/* 금형종류 */}
                    <td className="px-2 py-2">
                      <select
                        value={row.mold_type}
                        onChange={(e) => updateRow(index, 'mold_type', e.target.value as MoldType)}
                        className={cellInput}
                      >
                        {MOLD_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* 우선순위 */}
                    <td className="px-2 py-2">
                      <select
                        value={row.priority}
                        onChange={(e) => updateRow(index, 'priority', e.target.value as Priority)}
                        className={cellInput}
                      >
                        {PRIORITY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* 납기일 */}
                    <td className="px-2 py-2">
                      <DatePickerCell
                        value={row.due_date}
                        onChange={(val) => updateRow(index, 'due_date', val)}
                        placeholder="납기일"
                      />
                    </td>

                    {/* 설명 */}
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => updateRow(index, 'description', e.target.value)}
                        onKeyDown={(e) => handleRowKeyDown(e, index)}
                        placeholder="설명 입력"
                        className={cellInput}
                      />
                    </td>

                    {/* 삭제 */}
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        disabled={rows.length <= 1}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="행 삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isLoading || validRowCount === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            {isLoading ? '생성 중...' : `프로젝트 생성 (${validRowCount}건)`}
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
