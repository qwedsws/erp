# MoldERP 문서 Overview

이 문서는 코드베이스의 주요 문서를 빠르게 찾기 위한 루트 인덱스다.  
제품 요구사항, 아키텍처 원칙, 실행 계획, 과거 설계 문서를 목적별로 정리한다.

## 1) 처음 읽을 문서

1. `README.md`
- 프로젝트 개요, 실행 명령, 기술 스택, 디렉터리 구조.

2. `PRD/README.md`
- 모듈화된 PRD 문서 진입점.
- 단일 `PRD.md`는 현재 `PRD/`로 분리되었음을 안내하는 포인터 문서다.

3. `clean_architecture.md`
- 클린 아키텍처 계층 규칙, 의존성 방향, ESLint 경계 강제 정책의 기준 문서.

## 2) 개발/협업 가이드 문서

- `AGENTS.md`: 저장소 기여 가이드(구조, 명령, 코딩 규칙, PR 규칙).
- `CLAUDE.md`: Claude Code 작업 규칙과 레이어별 개발 패턴.

## 3) 실행 계획 문서

- `plans/plans-overview.md`: 현재 활성 계획과 실행 우선순위 요약.
- `plans/admin-hydration-pagination-plan.xml`: 관리자/목록 하이드레이션 및 페이지네이션 계획(완료 이력).
- `plans/admin-hydration-pagination-handoff.md`: 다른 터미널/에이전트용 실행 핸드오프.
- `plans/project-e2e-flow-consistency-plan.xml`: 수주→설계→구매→생산 E2E 데이터 일관성 계획.
- `plans/project-e2e-flow-consistency-handoff.md`: E2E 계획 실행 핸드오프.
- `plans/plan.xml`: 과거 완료된 자재/구매 구현 계획 아카이브.

## 4) 기능 상세/과거 설계 문서

- `docs/material_procurement/m_p_plan.md`
- `docs/material_procurement/plan_v1.md`
- `docs/material_procurement/plan_v2.md`
- `docs/projects/supabase_integration.md`

자재/구매 도메인의 상세 설계 이력 문서이며, 현재 구조와 차이가 있을 수 있다.

## 5) 레이어별 요약 문서

- `app/app-overview.md`
- `hooks/hooks-overview.md`
- `domain/domain-overview.md`
- `infrastructure/infrastructure-overview.md`
- `store/store-overview.md`
- `lib/lib-overview.md`

각 레이어의 역할, 핵심 파일, 현재 리팩터링 포인트를 빠르게 파악할 때 사용한다.

## 6) 문서 유지 원칙

- 요구사항 변경: `PRD/` 우선 갱신.
- 아키텍처 규칙 변경: `clean_architecture.md` 우선 갱신.
- 실행 계획 변경: `plans/` 문서(`changeLog` 포함) 갱신.
- 새 핵심 문서 추가 시 이 `overview.md`에 링크를 추가.
