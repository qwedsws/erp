# domain Overview

## Purpose
프레임워크 독립적인 핵심 비즈니스 규칙 레이어다.  
Entity, Port(Repository 인터페이스), Service, UseCase를 정의한다.

## Contents
- `domain/shared/`: 공통 엔티티/타입/에러 (43 types: 22 aliases + 21 interfaces)
- `domain/materials/`: 자재/재고/태그 규칙 + use-cases (6개: stock-out, adjust, bulk-adjust, receive-direct, receive-po)
- `domain/procurement/`: 공급처/발주/구매요청 규칙 + use-cases (convert-requests-to-po, create-purchase-requests-from-bom)
- `domain/sales/`: 수주/고객 규칙 + use-cases (create-order-with-project — 설계 step 자동 시드 포함)
- `domain/projects/`: 프로젝트/공정 규칙 + use-cases (progress-design-step)
- `domain/production/`: 생산 규칙 + services (resolveProjectStatusFromSteps, isStatusLater)
- `domain/accounting/`: 계정/분개/오픈아이템/이벤트 규칙 + auto-posting services
- `domain/quality/`, `domain/admin/`: 품질/관리 규칙

## E2E project_id 추적 (완료)
- PurchaseOrder.project_id: PR→PO 변환 시 자동 설정
- ConvertRequestsToPO: 혼합 프로젝트 PR → 프로젝트별 PO 자동 분할 (purchaseOrders[])
- receive-purchase-order: PO 입고 시 StockMovement(IN)에 project_id 전파
- STOCK_OUT 자동분개: project_id 기반 원가 추적
- PO_ORDERED 분개: project_id 포함

Supabase 연결 완료 도메인: materials, procurement, projects

## Notes
- Port 변경 시 in-memory/supabase 구현체를 동시에 맞춰야 한다.
- 과도한 범용 추상화보다, 자재/구매 도메인에 필요한 최소 query 계약부터 도입한다.
