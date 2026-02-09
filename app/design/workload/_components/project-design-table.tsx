'use client';

import React from 'react';
import Link from 'next/link';
import type { ProjectDesignRow } from '@/hooks/design/useDesignWorkloadStats';

interface ProjectDesignTableProps {
  projectDesignData: ProjectDesignRow[];
}

export function ProjectDesignTable({ projectDesignData }: ProjectDesignTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card mb-6">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold">프로젝트별 설계 진행률</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-3 font-medium">프로젝트</th>
              <th className="text-left p-3 font-medium">고객</th>
              <th className="text-center p-3 font-medium">공정</th>
              <th className="text-center p-3 font-medium">완료</th>
              <th className="text-center p-3 font-medium">진행</th>
              <th className="text-right p-3 font-medium">예상시간</th>
              <th className="text-right p-3 font-medium">완료시간</th>
              <th className="text-left p-3 font-medium">담당자</th>
              <th className="text-left p-3 font-medium">납기</th>
              <th className="p-3 font-medium w-40">진행률</th>
            </tr>
          </thead>
          <tbody>
            {projectDesignData.map(row => (
              <tr key={row.projectId} className="border-b border-border hover:bg-muted/20">
                <td className="p-3">
                  <Link href={`/projects/${row.projectId}`} className="hover:underline">
                    <span className="text-xs text-muted-foreground font-mono">{row.projectNo}</span>
                    <br />
                    <span className="font-medium">{row.projectName}</span>
                  </Link>
                </td>
                <td className="p-3 text-muted-foreground">{row.customerName}</td>
                <td className="p-3 text-center">{row.totalSteps}</td>
                <td className="p-3 text-center text-green-600 font-medium">{row.completed}</td>
                <td className="p-3 text-center text-blue-600 font-medium">{row.inProgress}</td>
                <td className="p-3 text-right tabular-nums">{row.totalHours}h</td>
                <td className="p-3 text-right tabular-nums text-green-600">{row.completedHours}h</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {row.assignees.length > 0 ? row.assignees.map(name => (
                      <span key={name} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {name}
                      </span>
                    )) : (
                      <span className="text-xs text-muted-foreground">미배정</span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{row.dueDate}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          row.progress >= 100 ? 'bg-green-500' : row.progress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${Math.min(row.progress, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-8 text-right">{row.progress}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
