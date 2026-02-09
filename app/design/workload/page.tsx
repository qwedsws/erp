'use client';

import React from 'react';
import { useDesignWorkloadStats } from '@/hooks/design/useDesignWorkloadStats';
import { PageHeader } from '@/components/common/page-header';
import { KpiCards } from './_components/kpi-cards';
import { DistributionCharts } from './_components/distribution-charts';
import { EngineerCharts } from './_components/engineer-charts';
import { ProjectDesignTable } from './_components/project-design-table';
import { EngineerDetailCards } from './_components/engineer-detail-cards';

export default function DesignStatisticsPage() {
  const {
    engineers,
    kpi,
    statusDistribution,
    codeDistribution,
    engineerChartData,
    engineerHoursData,
    projectDesignData,
    engineerWorkloads,
  } = useDesignWorkloadStats();

  return (
    <div>
      <PageHeader
        title="설계 통계"
        description="설계 공정 현황, 설계자 부하, 프로젝트 진행률을 한눈에 확인합니다"
      />

      <KpiCards kpi={kpi} engineerCount={engineers.length} />

      <DistributionCharts
        statusDistribution={statusDistribution}
        codeDistribution={codeDistribution}
      />

      <EngineerCharts
        engineerChartData={engineerChartData}
        engineerHoursData={engineerHoursData}
      />

      <ProjectDesignTable projectDesignData={projectDesignData} />

      <EngineerDetailCards
        engineers={engineers}
        engineerWorkloads={engineerWorkloads}
      />
    </div>
  );
}
