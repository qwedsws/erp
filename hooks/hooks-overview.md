# hooks Overview

## Purpose
UI와 도메인/인프라를 연결하는 브리지 레이어다.
Store 캐시 갱신, UseCase 실행, 비동기 액션 래핑을 담당한다.

## Contents
- `hooks/materials/`: 자재/재고/입고 관련 훅 + `useMaterialListQuery` (서버 페이지네이션)
- `hooks/procurement/`: 공급처/발주/구매요청/STEEL 태그 훅 + `usePurchaseOrderListQuery`, `usePurchaseRequestListQuery` (서버 페이지네이션)
- `hooks/accounting/`: 회계 이벤트/분개 조회 훅
- `hooks/admin/`: `useInitialHydration` (소형 참조 데이터만: suppliers, stocks, stockMovements, materialPrices, steelTags), `useProfiles`
- `hooks/shared/`: 공통 유틸 훅(`useAsyncAction` 등)

## 서버 페이지네이션 패턴 (완료)
리스트 전용 query hook이 repository의 `findPage()` 메서드를 호출하여 서버에서 검색/필터/페이지네이션 수행:
- `useMaterialListQuery`: 자재 목록 (category/search 필터)
- `usePurchaseOrderListQuery`: 발주 목록 (status/date/search 필터)
- `usePurchaseRequestListQuery`: 구매요청 목록 (status/date/search 필터)

각 훅은 `items`, `total`, `page`, `pageSize`, `isLoading`, `error`, `setPage`, `setSearch`, `refresh`를 반환한다.

## 재고 페이지 데이터 훅
- `useInventoryListQuery`: 재고 전용 페이지네이션 훅 (materials `findPage` + `getInventoryStats` 통합)
- `useInventoryPageData`: 재고 현황 데이터 + KPI 카드 필터링 (`showLowStockOnly` → 서버 `lowStockOnly` 필터)

## E2E 프로젝트 추적 훅 (완료)
- `hooks/projects/useProjectMaterialSummary`: 프로젝트별 자재 소요/집행 KPI 6개 지표 (PR/PO/입고/출고/미입고/미출고)
- `hooks/projects/useProjectTimeline`: 프로젝트 E2E 타임라인 (수주/설계/구매/생산 이벤트)
- `hooks/admin/useDataIntegrityChecks`: 데이터 정합성 점검 (project_id 누락률, 상태 불일치, 문서 연결 누락)
- `hooks/materials/useStocks`: STOCK_OUT 자동분개 트리거 추가 (PostAccountingEventUseCase)
- `hooks/production/useWorkOrders`: WorkOrder START/COMPLETE → ProcessStep/Project 상태 동기화
- `hooks/projects/useProcessSteps`: completeBomStep 추가 (BOM→PR 자동 생성)

## Notes
- `useInitialHydration`은 대형 리소스(materials, purchaseOrders, purchaseRequests) 선로딩을 제거하고 소형 참조 데이터만 유지한다.
- mutation 훅(useMaterials, usePurchaseOrders 등)은 store 캐시 갱신용으로 유지된다.
