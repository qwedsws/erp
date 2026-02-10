# lib Overview

## Purpose
공통 유틸과 데이터 접근 저수준 구현을 담는 보조 레이어다.

## Contents
- `lib/supabase/client.ts`, `lib/supabase/server.ts`: Supabase client 생성
- `lib/supabase/materials.ts`: materials/procurement 쿼리 함수 집합
- `lib/supabase/projects.ts`: projects/process_steps 쿼리 함수 집합
- `lib/mock-data.ts`, `lib/mock-accounting-data.ts`: InMemory 초기 데이터
- `lib/store.ts`: store 호환 진입점
- `lib/utils.ts`: 범용 유틸

## Notes
- 서버 페이지네이션/검색 성능 리팩터링의 핵심 쿼리 확장 지점은 `lib/supabase/materials.ts`다.
- 복잡한 쿼리 DSL 대신 리소스별 명시적 함수(`fetchXxxPage`)를 유지해 가독성을 지킨다.
- Supabase 쿼리 파일은 도메인별로 분리: materials.ts (자재+구매), projects.ts (프로젝트+공정).
