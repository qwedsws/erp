# plans Overview

## Purpose
실행 계획(XML)과 핸드오프 문서를 관리한다.
다른 터미널/에이전트가 현재 우선순위를 빠르게 파악하는 시작점이다.

## Contents
- `plans/plan.xml`: 과거 완료 계획(자재 구매 구축) 아카이브
- `plans/admin-hydration-pagination-plan.xml`: 완료된 서버 페이지네이션 계획
- `plans/project-e2e-flow-consistency-plan.xml`: 프로젝트 기준 E2E 데이터 흐름 일관성 계획
- `plans/project-e2e-flow-consistency-handoff.md`: 실행 핸드오프
- `plans/materials-pr-po-status-workflow-plan.xml`: PR→PO→입고 완료 상태 전이 정렬 계획
- `plans/pr-status-simplification-plan.xml`: 구매요청 승인/반려 제거 + 진행중 기반 발주 연계 전환 계획
- `plans/pragmatic-refactor-plan.xml`: 실용 리팩터링(복원력/정합성/가독성) 실행 계획

## Completed Plans
### project-e2e-flow-consistency (P0-P5 전체 완료)
- P0: 기준선 정의 — 단절 지점 식별
- P1: PurchaseOrder.project_id 추가, DB 마이그레이션, ConvertRequestsToPO 다건 PO 자동 분할
- P2: 수주 생성 시 설계 step 자동 시드(DESIGN_3D/2D/REVIEW/BOM), DESIGN_BOM→PR 자동 생성
- P3: PR/PO/입고/태그 project_id 전파 일관화, 프로젝트별 자재 소요/집행 KPI
- P4: WorkOrder↔ProcessStep↔Project 상태 동기화, E2E 타임라인 뷰
- P5: STOCK_OUT 자동분개, 데이터 정합성 점검 페이지, 과거 데이터 백필 마이그레이션
- 검증: tsc 0 errors, build 48 routes OK, lint 0 errors

### admin-hydration-pagination (P0-P5 전체 완료)
- P1: `domain/shared/types.ts`에 PageQuery/PageResult 타입, materials/procurement ports에 findPage 추가
- P2: Supabase/InMemory 양쪽에 fetchPage/findPage 구현
- P3: `useInitialHydration`에서 대형 리소스 3개 제거, 리스트 전용 query hook 3개 신설
- P4: PO/PR/자재 목록 3개 페이지를 서버 페이지네이션으로 전환
- P5: lint/build 통과 검증 완료

## Notes
- 계획 문서 수정 범위는 `plans/**`, `**/*-overview.md`로 제한한다.
- 코드 수정이 필요하면 plan의 `externalChanges` 항목을 기준으로 작업한다.
- 최신 워크플로우 변경 요청은 `materials-pr-po-status-workflow-plan.xml`을 우선 참조한다.
- 구매요청 상태 단순화 작업은 `pr-status-simplification-plan.xml`을 우선 참조한다.
- 범용 리팩터링 작업은 `pragmatic-refactor-plan.xml`을 우선 참조한다.
