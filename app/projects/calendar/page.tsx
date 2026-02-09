'use client';

import Link from 'next/link';
import { List } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { useProjectCalendarData } from '@/hooks/projects/useProjectCalendarData';
import { ProjectCalendarView } from './_components/project-calendar-view';

export default function ProjectCalendarPage() {
  const calendarData = useProjectCalendarData();

  return (
    <div>
      <PageHeader
        title="프로젝트 일정"
        description="프로젝트 일정을 캘린더로 확인합니다"
        actions={
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-4 py-2 border border-input rounded-md text-sm font-medium hover:bg-accent"
          >
            <List size={16} /> 목록으로
          </Link>
        }
      />

      <ProjectCalendarView data={calendarData} />
    </div>
  );
}
