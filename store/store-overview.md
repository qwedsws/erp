# store Overview

## Purpose
Zustand 기반 캐시 레이어다.  
데이터 보관과 단순 cache mutation만 담당하며, 비즈니스 로직은 넣지 않는다.

## Contents
- `store/materials-slice.ts`: materials/stocks/movements/prices/steelTags
- `store/procurement-slice.ts`: suppliers/purchaseOrders/purchaseRequests
- `store/sales-slice.ts`, `store/projects-slice.ts`, `store/production-slice.ts`, `store/quality-slice.ts`
- `store/accounting-slice.ts`: glAccounts/journalEntries/arOpenItems/apOpenItems/accountingEvents
- `store/admin-slice.ts`: `profiles`, `isHydrated`
- `store/index.ts`: 전체 slice 결합

## Notes
- `isHydrated` + 전역 배열 캐시는 대량 리스트에서 병목이 될 수 있어, 목록 화면은 서버 페이지네이션 훅으로 분리한다.
- 서버 페이지네이션 전환 시 store는 "참조 데이터/상세 데이터 캐시" 중심으로 축소한다.
- list 페이지 상태(page/search/filter)는 훅 로컬 상태로 관리하는 방향이 안전하다.
