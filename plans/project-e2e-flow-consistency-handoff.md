# Project E2E Flow Consistency Handoff

## 상태: 완료 (P0-P5 전체)

## 목표
영업(수주)부터 프로젝트/설계, 자재/구매, 생산, 회계까지
`project_id` 기준 데이터 흐름을 끊김 없이 유지한다.

## 실행 완료 요약

### P1: 공통 데이터 계약/저장소 동기화
- `PurchaseOrder.project_id?: string` 필드 추가 (domain/shared/entities.ts)
- `purchase_orders.project_id` DB 마이그레이션 (text, FK → projects, 인덱스)
- Supabase/InMemory repos 자동 반영 (spread 패턴)
- `ConvertRequestsToPO` 다건 반환: `purchaseOrders: PurchaseOrder[]`
- 프로젝트별 PO 자동 분할 (혼합 프로젝트 PR → N개 PO)

### P2: 영업→프로젝트→설계 경계 강화
- 수주 생성 시 DESIGN_3D/2D/REVIEW/BOM step 자동 시드 (idempotent)
- `IProcessStepRepository.createMany()` 추가
- DESIGN_BOM 완료 시 BOM→PR 자동 생성 (`CreatePurchaseRequestsFromBomUseCase`)

### P3: 자재/구매→재고 흐름 일관화
- PO 입고 시 StockMovement(IN)에 `project_id` 전파 (po.project_id)
- SteelTag 생성 시 PO의 project_id 전파
- 프로젝트별 자재 소요/집행 KPI 6개 지표 (`useProjectMaterialSummary`)

### P4: 생산 공정 연동 강화
- WorkOrder START/COMPLETE → ProcessStep 상태 동기화
- ProcessStep 완료 시 Project 상태 자동 진행 (`resolveProjectStatusFromSteps`)
- 프로젝트 E2E 타임라인 뷰 (수주/설계/구매/생산 4종, `useProjectTimeline`)

### P5: 회계/검증/운영 고도화
- STOCK_OUT 자동분개 트리거 (DR: WIP 1300, CR: Material 1200)
- PO_ORDERED 분개 라인에 project_id 추가
- 데이터 정합성 점검 페이지 (`/admin/data-integrity`)
- 과거 데이터 백필 마이그레이션 (PO→SM→ST project_id 보정)

## 주요 변경 파일
| 영역 | 파일 | 변경 |
|------|------|------|
| Entity | `domain/shared/entities.ts` | PurchaseOrder.project_id 추가 |
| UseCase | `domain/procurement/use-cases/convert-requests-to-po.ts` | 다건 PO 분할 |
| UseCase | `domain/sales/use-cases/create-order-with-project.ts` | 설계 step 시드 |
| UseCase | `domain/procurement/use-cases/create-purchase-requests-from-bom.ts` | 신규 |
| UseCase | `domain/materials/use-cases/receive-purchase-order.ts` | project_id 전파 |
| Service | `domain/accounting/services.ts` | PO_ORDERED project_id |
| Service | `domain/production/services.ts` | resolveProjectStatusFromSteps |
| Hook | `hooks/materials/useStocks.ts` | STOCK_OUT 자동분개 |
| Hook | `hooks/production/useWorkOrders.ts` | step/project 상태 동기 |
| Hook | `hooks/projects/useProjectTimeline.ts` | 신규 |
| Hook | `hooks/projects/useProjectMaterialSummary.ts` | 신규 |
| Hook | `hooks/admin/useDataIntegrityChecks.ts` | 신규 |
| Page | `app/admin/data-integrity/page.tsx` | 신규 |
| DB | `add_project_id_to_purchase_orders` | 마이그레이션 |
| DB | `backfill_project_refs` | 백필 마이그레이션 |

## 검증 결과
- `tsc --noEmit`: 0 errors
- `npm run build`: 48 routes, 성공
- `npm run lint`: 0 errors (2 pre-existing warnings)
