'use client';

import React from 'react';
import { PageHeader } from '@/components/common/page-header';
import { MOLD_TYPE_MAP, PROJECT_STATUS_MAP, DEFECT_TYPE_MAP } from '@/types';
import { Tag } from 'lucide-react';

const PROCESS_CODES = [
  { code: 'DESIGN_3D', label: '3D 모델링' },
  { code: 'DESIGN_2D', label: '2D 도면' },
  { code: 'DESIGN_REVIEW', label: '설계 검토' },
  { code: 'DESIGN_BOM', label: 'BOM 확정' },
  { code: 'MATERIAL_PREP', label: '자재 준비' },
  { code: 'ROUGHING', label: '황삭' },
  { code: 'MCT', label: 'MCT 가공' },
  { code: 'EDM', label: '방전 가공' },
  { code: 'WIRE', label: '와이어 가공' },
  { code: 'GRINDING', label: '연마' },
  { code: 'HEAT_TREATMENT', label: '열처리' },
  { code: 'ASSEMBLY', label: '조립' },
  { code: 'TRYOUT', label: '트라이아웃' },
  { code: 'FINAL_INSPECTION', label: '최종검사' },
];

export default function CodesPage() {
  return (
    <div>
      <PageHeader
        title="공통 코드 관리"
        description="시스템에서 사용하는 공통 코드를 관리합니다"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 금형 종류 */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
            <Tag size={16} className="text-muted-foreground" />
            <h3 className="font-semibold text-sm">금형 종류</h3>
            <span className="ml-auto text-xs text-muted-foreground">{Object.keys(MOLD_TYPE_MAP).length}건</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-2.5 text-left font-medium text-muted-foreground text-xs">코드</th>
                <th className="px-5 py-2.5 text-left font-medium text-muted-foreground text-xs">한글명</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(MOLD_TYPE_MAP).map(([code, label]) => (
                <tr key={code} className="border-b border-border last:border-0">
                  <td className="px-5 py-2.5 font-mono text-xs text-muted-foreground">{code}</td>
                  <td className="px-5 py-2.5 text-sm">{label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 프로젝트 상태 */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
            <Tag size={16} className="text-muted-foreground" />
            <h3 className="font-semibold text-sm">프로젝트 상태</h3>
            <span className="ml-auto text-xs text-muted-foreground">{Object.keys(PROJECT_STATUS_MAP).length}건</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-2.5 text-left font-medium text-muted-foreground text-xs">코드</th>
                <th className="px-5 py-2.5 text-left font-medium text-muted-foreground text-xs">한글명</th>
                <th className="px-5 py-2.5 text-left font-medium text-muted-foreground text-xs">색상</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(PROJECT_STATUS_MAP).map(([code, { label, color }]) => (
                <tr key={code} className="border-b border-border last:border-0">
                  <td className="px-5 py-2.5 font-mono text-xs text-muted-foreground">{code}</td>
                  <td className="px-5 py-2.5 text-sm">{label}</td>
                  <td className="px-5 py-2.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
                      {label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 공정 코드 */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
            <Tag size={16} className="text-muted-foreground" />
            <h3 className="font-semibold text-sm">공정 코드</h3>
            <span className="ml-auto text-xs text-muted-foreground">{PROCESS_CODES.length}건</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-2.5 text-left font-medium text-muted-foreground text-xs">코드</th>
                <th className="px-5 py-2.5 text-left font-medium text-muted-foreground text-xs">한글명</th>
              </tr>
            </thead>
            <tbody>
              {PROCESS_CODES.map(({ code, label }) => (
                <tr key={code} className="border-b border-border last:border-0">
                  <td className="px-5 py-2.5 font-mono text-xs text-muted-foreground">{code}</td>
                  <td className="px-5 py-2.5 text-sm">{label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 불량 유형 */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
            <Tag size={16} className="text-muted-foreground" />
            <h3 className="font-semibold text-sm">불량 유형</h3>
            <span className="ml-auto text-xs text-muted-foreground">{Object.keys(DEFECT_TYPE_MAP).length}건</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-2.5 text-left font-medium text-muted-foreground text-xs">코드</th>
                <th className="px-5 py-2.5 text-left font-medium text-muted-foreground text-xs">한글명</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(DEFECT_TYPE_MAP).map(([code, label]) => (
                <tr key={code} className="border-b border-border last:border-0">
                  <td className="px-5 py-2.5 font-mono text-xs text-muted-foreground">{code}</td>
                  <td className="px-5 py-2.5 text-sm">{label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
