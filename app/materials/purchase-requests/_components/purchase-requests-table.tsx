'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, ArrowRightLeft, Undo2 } from 'lucide-react';
import { StatusBadge } from '@/components/common/status-badge';
import { PR_STATUS_MAP } from '@/types';
import type { PurchaseRequest, Material, Profile } from '@/types';

interface PurchaseRequestsTableProps {
  requests: PurchaseRequest[];
  materialById: Map<string, Material>;
  profileById: Map<string, Profile>;
  checkedIds: Set<string>;
  approvedIds: Set<string>;
  onToggleCheck: (id: string) => void;
  onToggleAllApproved: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onConvertSingle: (id: string) => void;
  onRevoke: (id: string) => void;
}

export function PurchaseRequestsTable({
  requests,
  materialById,
  profileById,
  checkedIds,
  approvedIds,
  onToggleCheck,
  onToggleAllApproved,
  onApprove,
  onReject,
  onConvertSingle,
  onRevoke,
}: PurchaseRequestsTableProps) {
  const router = useRouter();
  const allApprovedChecked =
    approvedIds.size > 0 && [...approvedIds].every((id) => checkedIds.has(id));

  const hasDimensions = useMemo(
    () => requests.some((pr) => pr.dimension_w && pr.dimension_l && pr.dimension_h),
    [requests],
  );

  const colCount = hasDimensions ? 10 : 9;

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-3 text-center w-10">
                {approvedIds.size > 0 && (
                  <input
                    type="checkbox"
                    checked={allApprovedChecked}
                    onChange={onToggleAllApproved}
                    className="h-4 w-4 rounded border-gray-300"
                    title="승인 건 전체 선택"
                  />
                )}
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">요청번호</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">자재명</th>
              {hasDimensions && (
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">치수(mm)</th>
              )}
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">수량</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">필요일</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">요청자</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">상태</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">요청일</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">액션</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((pr) => {
              const material = materialById.get(pr.material_id);
              const requester = profileById.get(pr.requested_by);
              const isApproved = pr.status === 'APPROVED';
              const hasDims = pr.dimension_w && pr.dimension_l && pr.dimension_h;
              const dimensionStr = hasDims
                ? `${pr.dimension_w}×${pr.dimension_l}×${pr.dimension_h}`
                : '-';

              return (
                <tr
                  key={pr.id}
                  className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/30"
                  onClick={() => router.push(`/materials/purchase-requests/${pr.id}`)}
                >
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    {isApproved && (
                      <input
                        type="checkbox"
                        checked={checkedIds.has(pr.id)}
                        onChange={() => onToggleCheck(pr.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{pr.pr_no}</td>
                  <td className="px-4 py-3 font-medium">{material?.name || '-'}</td>
                  {hasDimensions && (
                    <td className="px-4 py-3 font-mono text-xs">{dimensionStr}</td>
                  )}
                  <td className="px-4 py-3 text-right">
                    {pr.quantity.toLocaleString()}
                    {material?.unit ? ` ${material.unit}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(pr.required_date).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3">{requester?.name || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={pr.status} statusMap={PR_STATUS_MAP} />
                  </td>
                  <td className="px-4 py-3">
                    {new Date(pr.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      {pr.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => onApprove(pr.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                            title="승인"
                          >
                            <Check size={12} />
                            승인
                          </button>
                          <button
                            onClick={() => onReject(pr.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                            title="반려"
                          >
                            <X size={12} />
                            반려
                          </button>
                        </>
                      )}
                      {isApproved && (
                        <>
                          <button
                            onClick={() => onConvertSingle(pr.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                            title="발주 전환"
                          >
                            <ArrowRightLeft size={12} />
                            발주 전환
                          </button>
                          <button
                            onClick={() => onRevoke(pr.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium hover:bg-orange-200 transition-colors"
                            title="철회"
                          >
                            <Undo2 size={12} />
                            철회
                          </button>
                        </>
                      )}
                      {pr.status === 'REJECTED' && (
                        <button
                          onClick={() => onRevoke(pr.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium hover:bg-orange-200 transition-colors"
                          title="철회"
                        >
                          <Undo2 size={12} />
                          철회
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {requests.length === 0 && (
              <tr>
                <td colSpan={colCount} className="px-4 py-8 text-center text-muted-foreground">
                  구매 요청 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
