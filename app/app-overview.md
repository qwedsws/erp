# app Overview

## Purpose
Next.js App Router 기반 Presentation 레이어다.
화면 렌더링과 사용자 상호작용을 담당하며, 비즈니스 규칙은 hooks/domain으로 위임한다.

## Route Sections
- `app/page.tsx`: 메인 대시보드
- `app/login/`, `app/auth/callback/route.ts`: 로그인/인증 콜백
- `app/sales/`: 고객/수주/통계
- `app/projects/`: 프로젝트 목록/등록/캘린더/상세
- `app/design/`: 설계 공정 현황/관리/업무배정/워크로드
- `app/production/`: 작업지시/현장 대시보드
- `app/materials/`: 품목/재고/거래처/구매요청/발주/입고/통계
- `app/quality/`: 검사/트라이아웃/클레임
- `app/accounting/`: 회계 대시보드/분개/채권/채무
- `app/admin/`: 사용자/역할/코드/데이터 정합성

## 서버 페이지네이션 전환 완료
다음 3개 목록 페이지가 서버 페이지네이션/검색으로 전환됨:
- `app/materials/items/page.tsx` → `useMaterialListQuery`
- `app/materials/purchase-orders/page.tsx` → `usePurchaseOrderListQuery`
- `app/materials/purchase-requests/page.tsx` → `usePurchaseRequestListQuery`

## 재고 현황 (서버 페이지네이션 + KPI 필터)
- `app/materials/inventory/page.tsx`: 서버 페이지네이션 + 검색 + KPI 카드 필터
  - "총 자재 품목" / "재고 부족 경고" KPI 카드 클릭으로 서버 `lowStockOnly` 필터 전환
  - KPI 통계는 `getInventoryStats()` 별도 서버 집계 (전체 데이터 기반)

## 프로젝트 상세 페이지 강화 (E2E 완료)
- `app/projects/[id]/page.tsx`: 자재/구매 현황 KPI 6개 + E2E 타임라인 섹션 추가
  - 자재 KPI: 구매요청/발주금액/입고금액/출고금액/미입고/미출고
  - 타임라인: 수주/설계/구매/생산 이벤트 시간순 표시

## 데이터 정합성 점검 페이지
- `app/admin/data-integrity/page.tsx`: project_id 누락률, 상태 불일치, 문서 연결 누락 3종 지표 조회

## Notes
- `app/**`는 `hooks/**` 경유로 데이터 접근한다.
- `domain/**`, `infrastructure/**` 직접 import는 금지(클린 아키텍처 경계).
