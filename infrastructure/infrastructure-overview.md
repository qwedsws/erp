# infrastructure Overview

## Purpose
Domain Port의 실제 구현체를 제공하는 레이어다.  
런타임에서 InMemory/Supabase 저장소를 선택하고 DI로 주입한다.

## Contents
- `infrastructure/di/container.ts`: repository 팩토리/싱글톤 관리
- `infrastructure/repositories/in-memory/`: 모든 도메인 메모리 구현
- `infrastructure/repositories/supabase/`: materials, procurement, projects Supabase 구현

Supabase 연결 현황:
| 도메인 | 리포지토리 파일 | 쿼리 함수 파일 | 테이블 |
|--------|----------------|---------------|--------|
| materials | `supabase/materials.ts` | `lib/supabase/materials.ts` | materials, stocks, stock_movements, material_prices, steel_tags |
| procurement | `supabase/procurement.ts` (materials.ts에 포함) | `lib/supabase/materials.ts` | suppliers, purchase_orders, purchase_order_items, purchase_requests |
| projects | `supabase/projects.ts` | `lib/supabase/projects.ts` | projects, process_steps |

페이지네이션 전환 주요 수정 지점:
- `infrastructure/repositories/in-memory/materials.ts`
- `infrastructure/repositories/in-memory/procurement.ts`
- `infrastructure/repositories/supabase/materials.ts`
- `infrastructure/repositories/supabase/procurement.ts`

## Notes
- 기존 `findAll` 하위호환을 유지한 채 page/query 메서드를 병행 추가하는 전략을 사용한다.
- Supabase 쿼리 상세는 도메인별 `lib/supabase/*.ts`에서 관리한다.
- `USE_SUPABASE_REPOS` 플래그(env 기반)로 InMemory/Supabase를 런타임 전환한다.
