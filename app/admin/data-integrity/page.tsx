'use client';

import { PageHeader } from '@/components/common/page-header';
import {
  useDataIntegrityChecks,
  type IntegrityMetric,
} from '@/hooks/admin/useDataIntegrityChecks';

export default function DataIntegrityPage() {
  const categories = useDataIntegrityChecks();

  const totalIssues = categories.reduce(
    (sum, cat) => sum + cat.metrics.reduce((s, m) => s + m.issues, 0),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="데이터 정합성 점검"
        description="프로젝트 E2E 데이터 흐름의 일관성을 점검합니다."
      />

      {/* Summary */}
      <div className="border rounded-none p-4 flex items-center gap-4">
        <span className="text-sm text-muted-foreground">전체 문제 건수</span>
        <span
          className={`text-2xl font-bold ${totalIssues > 0 ? 'text-red-600' : 'text-green-600'}`}
        >
          {totalIssues}건
        </span>
        {totalIssues === 0 && (
          <span className="text-sm text-green-600">
            모든 정합성 점검을 통과했습니다.
          </span>
        )}
      </div>

      {categories.map((cat) => (
        <div key={cat.title} className="border rounded-none p-4">
          <h3 className="font-semibold text-lg mb-3">{cat.title}</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">항목</th>
                <th className="text-right py-2">전체</th>
                <th className="text-right py-2">문제</th>
                <th className="text-right py-2">비율</th>
              </tr>
            </thead>
            <tbody>
              {cat.metrics.map((m: IntegrityMetric) => (
                <tr key={m.label} className="border-b last:border-0">
                  <td className="py-2">{m.label}</td>
                  <td className="text-right py-2">{m.total}</td>
                  <td
                    className={`text-right py-2 ${m.issues > 0 ? 'text-red-600 font-medium' : ''}`}
                  >
                    {m.issues}
                  </td>
                  <td
                    className={`text-right py-2 ${m.issues > 0 ? 'text-red-600 font-medium' : ''}`}
                  >
                    {m.rate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
