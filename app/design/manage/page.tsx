'use client';

import React from 'react';
import { PageHeader } from '@/components/common/page-header';
import { useDesignManageViewModel } from '@/hooks/design/useDesignManageViewModel';
import { ProjectGrid } from './_components/project-grid';
import { DesignStepModal } from './_components/design-step-modal';
import { EngineerSummary } from './_components/engineer-summary';
import {
  ListChecks,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
} from 'lucide-react';

export default function DesignManagePage() {
  const vm = useDesignManageViewModel();

  return (
    <div>
      <PageHeader
        title="설계 공정 관리"
        description="프로젝트를 선택하여 설계 공정을 추가하고 관리합니다"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <KpiCard label="전체 공정" value={vm.kpi.total} icon={<ListChecks className="h-4 w-4 text-blue-500" />} />
        <KpiCard label="대기" value={vm.kpi.planned} icon={<Clock className="h-4 w-4 text-gray-400" />} valueClass="text-gray-600" />
        <KpiCard label="진행중" value={vm.kpi.inProgress} icon={<Clock className="h-4 w-4 text-blue-500" />} valueClass="text-blue-600" />
        <KpiCard label="완료" value={vm.kpi.completed} icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} valueClass="text-green-600" />
        <KpiCard label="총 예상시간" value={vm.kpi.totalEstHours} icon={<Clock className="h-4 w-4 text-purple-500" />} suffix="h" />
        <KpiCard label="완료 시간" value={vm.kpi.completedEstHours} icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} valueClass="text-green-600" suffix="h" />
        <div className={`rounded-lg border p-3 ${vm.kpi.noStepProjects > 0 ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' : 'border-border bg-card'}`}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">공정 미등록</p>
            <AlertCircle className={`h-4 w-4 ${vm.kpi.noStepProjects > 0 ? 'text-yellow-500' : 'text-gray-400'}`} />
          </div>
          <p className={`text-2xl font-bold ${vm.kpi.noStepProjects > 0 ? 'text-yellow-600' : ''}`}>{vm.kpi.noStepProjects}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="프로젝트 검색 (이름, 번호)"
            value={vm.searchQuery}
            onChange={(e) => vm.setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-card focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <span className="text-sm text-muted-foreground ml-auto">
          {vm.designProjects.length}개 프로젝트 · 클릭하여 공정 관리
        </span>
      </div>

      {/* Project Grid */}
      <ProjectGrid
        designProjects={vm.designProjects}
        stepsByProject={vm.stepsByProject}
        searchQuery={vm.searchQuery}
        getCustomerName={vm.getCustomerName}
        getDaysRemaining={vm.getDaysRemaining}
        onProjectClick={vm.openModal}
      />

      {/* Engineer Summary */}
      <EngineerSummary
        engineers={vm.engineers}
        allDesignSteps={vm.allDesignSteps}
      />

      {/* Design Step Modal */}
      {vm.selectedProjectId && vm.selectedProject && (
        <DesignStepModal
          selectedProjectId={vm.selectedProjectId}
          selectedProject={vm.selectedProject}
          modalSteps={vm.modalSteps}
          addForm={vm.addForm}
          setAddForm={vm.setAddForm}
          getAssigneeName={vm.getAssigneeName}
          getCustomerName={vm.getCustomerName}
          getDaysRemaining={vm.getDaysRemaining}
          onClose={vm.closeModal}
          onAdd={vm.handleAdd}
          onDeleteStep={vm.handleDeleteStep}
        />
      )}
    </div>
  );
}

/** Small reusable KPI card used only in this page. */
function KpiCard({
  label,
  value,
  icon,
  valueClass,
  suffix,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  valueClass?: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${valueClass ?? ''}`}>
        {value}
        {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
      </p>
    </div>
  );
}
