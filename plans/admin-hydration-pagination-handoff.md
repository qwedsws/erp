# Admin Hydration Refactor Handoff

## Goal
`hooks/admin/useInitialHydration.ts` 기반 대량 선로딩을 제거하고,  
자재/구매 목록 화면을 서버 페이지네이션 + 서버 검색으로 전환한다.

## Why Now
- 현재는 `findAll` 후 클라이언트에서 필터/검색/페이지네이션을 수행한다.
- 데이터가 커질수록 초기 로딩, 메모리 사용, 검색 응답성이 급격히 악화된다.

## Active Plan
- 상세 계획: `plans/admin-hydration-pagination-plan.xml`
- 실행 순서: `P1 -> P2 -> P3 -> P4 -> P5`

## First Execution Slice (recommended)
1. `domain/shared/types.ts`: page query/result 타입 추가
2. `domain/materials/ports.ts`, `domain/procurement/ports.ts`: page 조회 메서드 추가
3. `lib/supabase/materials.ts`: `fetchXxxPage` + `count` + 검색/필터
4. `infrastructure/repositories/*/{materials,procurement}.ts`: page 메서드 연결

## Second Execution Slice
1. `hooks/admin/useInitialHydration.ts`: 대형 리소스 선로딩 축소/호환 처리
2. 신규 query 훅 작성:
   - `hooks/materials/useMaterialListQuery.ts`
   - `hooks/procurement/usePurchaseOrderListQuery.ts`
   - `hooks/procurement/usePurchaseRequestListQuery.ts`

## Third Execution Slice (UI migration)
1. `app/materials/purchase-orders/page.tsx`
2. `app/materials/purchase-requests/page.tsx`
3. `app/materials/items/page.tsx`

## Guardrails
- 과도한 추상화 금지: 공통 QueryBuilder 프레임워크 도입하지 않음.
- 기존 `findAll`을 즉시 제거하지 말고 호환 기간 유지.
- Port 변경 시 in-memory/supabase 구현체를 같은 커밋에서 맞춤.

## Verification
- `npm run lint`
- `npm run build`
- 수동 점검: 검색/필터/페이지 이동/수정 후 목록 반영

## Update Rule
Phase 완료 시 `plans/admin-hydration-pagination-plan.xml`의 `task status`와 `changeLog`를 반드시 업데이트한다.
