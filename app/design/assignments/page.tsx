'use client';

import React from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Users, UserPlus, UserCheck, CheckSquare } from 'lucide-react';
import { useDesignAssignmentsViewModel } from '@/hooks/design/useDesignAssignmentsViewModel';
import { AssignmentsToolbar } from './_components/assignments-toolbar';
import { BatchAssignPanel } from './_components/batch-assign-panel';
import { AssignmentsTable } from './_components/assignments-table';
import { EngineerWorkloadPanel } from './_components/engineer-workload-panel';

export default function DesignAssignmentsPage() {
  const vm = useDesignAssignmentsViewModel();

  return (
    <div>
      <PageHeader
        title="설계 업무 배정"
        description="프로젝트별 설계 공정에 설계자를 배정합니다"
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="전체 설계 공정 수"
          value={vm.kpi.total}
          sub="등록된 전체 설계 공정"
          icon={<CheckSquare className="h-5 w-5 text-blue-500" />}
        />
        <KpiCard
          label="배정 완료"
          value={vm.kpi.assigned}
          sub="담당자가 배정된 공정"
          icon={<UserCheck className="h-5 w-5 text-green-500" />}
        />
        <KpiCard
          label="미배정"
          value={vm.kpi.unassigned}
          sub="담당자 미배정 공정"
          icon={
            <UserPlus
              className={`h-5 w-5 ${vm.kpi.unassigned > 0 ? 'text-yellow-500' : 'text-gray-400'}`}
            />
          }
          highlight={vm.kpi.unassigned > 0}
          valueClassName={vm.kpi.unassigned > 0 ? 'text-yellow-600' : undefined}
        />
        <KpiCard
          label="설계자 수"
          value={vm.kpi.engineerCount}
          sub="활성 설계 인력"
          icon={<Users className="h-5 w-5 text-purple-500" />}
        />
      </div>

      <AssignmentsToolbar
        statusFilter={vm.statusFilter}
        onStatusFilterChange={vm.setStatusFilter}
        projectFilter={vm.projectFilter}
        onProjectFilterChange={vm.setProjectFilter}
        projectsWithDesign={vm.projectsWithDesign}
        batchMode={vm.batchMode}
        onEnterBatchMode={() => vm.setBatchMode(true)}
      />

      <BatchAssignPanel
        visible={vm.batchMode}
        selectedCount={vm.selectedStepIds.size}
        allUnassignedSelected={vm.allUnassignedSelected}
        batchAssigneeId={vm.batchAssigneeId}
        engineers={vm.engineers}
        onSelectAllUnassigned={vm.handleSelectAllUnassigned}
        onAssigneeChange={vm.setBatchAssigneeId}
        onAssign={() => void vm.handleBatchAssign()}
        onCancel={vm.handleCancelBatch}
      />

      <AssignmentsTable
        filteredSteps={vm.filteredSteps}
        batchMode={vm.batchMode}
        selectedStepIds={vm.selectedStepIds}
        engineers={vm.engineers}
        activeFilterLabel={vm.activeFilterLabel}
        getProjectName={vm.getProjectName}
        getAssigneeName={vm.getAssigneeName}
        onToggleStep={vm.handleToggleStep}
        onSingleAssign={vm.handleSingleAssign}
      />

      <EngineerWorkloadPanel
        engineerWorkloads={vm.engineerWorkloads}
        maxWorkload={vm.maxWorkload}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small internal KPI card component
// ---------------------------------------------------------------------------

interface KpiCardProps {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
  highlight?: boolean;
  valueClassName?: string;
}

function KpiCard({ label, value, sub, icon, highlight, valueClassName }: KpiCardProps) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight
          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
          : 'border-border bg-card'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className={`text-3xl font-bold mt-2 ${valueClassName ?? ''}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}
