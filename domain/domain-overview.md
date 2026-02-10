# domain Overview

## Purpose
프레임워크 독립적인 핵심 비즈니스 규칙 레이어다.  
Entity, Port(Repository 인터페이스), Service, UseCase를 정의한다.

## Contents
- `domain/shared/`: 공통 엔티티/타입/에러/문서번호 생성
- `domain/sales/`: 고객/수주/결제 엔티티와 수주-프로젝트 생성 유스케이스
- `domain/projects/`: 프로젝트/공정 엔티티와 공정 진행 유스케이스
- `domain/design` 전용 폴더는 없고, 설계 공정은 `projects`/`production` 모델에 포함
- `domain/materials/`: 자재/재고/태그/입출고 규칙
- `domain/procurement/`: 공급처/발주/구매요청 규칙, PR→PO 변환
- `domain/production/`: 작업지시/작업실적 규칙, 상태 전이 서비스
- `domain/quality/`: 검사/트라이아웃/클레임 규칙
- `domain/admin/`: 사용자 프로필/권한 관리 규칙
- `domain/accounting/`: 계정/분개/오픈아이템/이벤트 + 자동분개 포스팅 유스케이스

## E2E project_id 추적 (완료)
- PurchaseOrder.project_id: PR→PO 변환 시 자동 설정
- ConvertRequestsToPO: 혼합 프로젝트 PR → 프로젝트별 PO 자동 분할 (purchaseOrders[])
- receive-purchase-order: PO 입고 시 StockMovement(IN)에 project_id 전파
- STOCK_OUT 자동분개: project_id 기반 원가 추적
- PO_ORDERED 분개: project_id 포함

## Persistence 상태 (DI 기준)
- Supabase 연결: `materials`, `procurement`, `projects`, `admin`
- In-Memory 유지: `sales`, `production`, `quality`, `accounting`

## Notes
- Port 변경 시 in-memory/supabase 구현체를 동시에 맞춰야 한다.
- 과도한 범용 추상화보다 도메인별 최소 query 계약을 우선 도입한다.
