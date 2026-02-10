# 프로젝트 도메인 Supabase 연동

> **작성일**: 2026-02-10
> **상태**: 완료
> **관련 마이그레이션**: `create_projects_and_process_steps`

---

## 1. 개요

프로젝트(`projects`) 및 공정단계(`process_steps`) 도메인을 Supabase DB에 연결.
기존 InMemory 구현과 동일한 포트 인터페이스(`IProjectRepository`, `IProcessStepRepository`)를 Supabase 구현체로 제공하며, 환경변수 기반으로 런타임 전환된다.

### 전환 조건

```
NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
→ 둘 다 설정되면 Supabase, 아니면 InMemory
```

---

## 2. DB 스키마

### 2.1 projects 테이블

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | text | PK | UUID |
| project_no | text | UNIQUE, NOT NULL | PJ-YYYY-### 형식 |
| order_id | text | nullable | 수주 참조 |
| name | text | NOT NULL | 프로젝트명 |
| mold_type | text | NOT NULL, CHECK | INJECTION, PRESS, DIE_CASTING, BLOW, OTHER |
| status | text | NOT NULL, DEFAULT 'CONFIRMED', CHECK | 13종 상태값 |
| priority | text | NOT NULL, DEFAULT 'MEDIUM', CHECK | HIGH, MEDIUM, LOW |
| manager_id | text | nullable | 담당자 참조 |
| start_date | text | nullable | 시작일 |
| due_date | text | NOT NULL | 납기일 |
| completed_date | text | nullable | 완료일 |
| description | text | nullable | 설명 |
| specifications | jsonb | nullable | 사양 (자유 형식) |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | |

**인덱스**: `status`, `order_id`(partial), `manager_id`(partial)

**status CHECK 값** (13종):
`CONFIRMED`, `DESIGNING`, `DESIGN_COMPLETE`, `MATERIAL_PREP`, `MACHINING`, `ASSEMBLING`, `TRYOUT`, `REWORK`, `FINAL_INSPECTION`, `READY_TO_SHIP`, `SHIPPED`, `DELIVERED`, `AS_SERVICE`

### 2.2 process_steps 테이블

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | text | PK | UUID |
| project_id | text | NOT NULL, FK→projects(CASCADE) | 프로젝트 참조 |
| category | text | NOT NULL, CHECK | DESIGN, PRODUCTION, ASSEMBLY, QUALITY |
| process_code | text | NOT NULL | 공정 코드 |
| process_name | text | NOT NULL | 공정명 |
| sequence | integer | NOT NULL | 순서 |
| estimated_hours | numeric | nullable | 예상 공수 |
| machine_id | text | nullable | 설비 참조 |
| assignee_id | text | nullable | 작업자 참조 |
| status | text | NOT NULL, DEFAULT 'PLANNED', CHECK | PLANNED, IN_PROGRESS, COMPLETED, SKIPPED, ON_HOLD |
| start_date | text | nullable | 시작일 |
| end_date | text | nullable | 종료일 |
| predecessor_id | text | nullable | 선행 공정 |
| outputs | jsonb | nullable | 산출물 (자유 형식) |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | |

**인덱스**: `project_id`, `status`, `assignee_id`(partial)
**CASCADE**: 프로젝트 삭제 시 공정단계도 자동 삭제

---

## 3. 코드 구조

### 3.1 레이어별 파일

```
domain/projects/ports.ts              ← 포트 인터페이스 (변경 없음)
  IProjectRepository
  IProcessStepRepository

lib/supabase/projects.ts              ← [신규] Supabase 쿼리 함수
  fetchProjects, fetchProjectById
  insertProject, updateProjectDB, deleteProjectDB
  fetchProcessSteps, fetchProcessStepsByProjectId
  insertProcessStep, updateProcessStepDB, deleteProcessStepDB

infrastructure/repositories/
  supabase/projects.ts                ← [신규] Supabase 리포지토리
    SupabaseProjectRepository
    SupabaseProcessStepRepository
  in-memory/projects.ts               ← 기존 InMemory (변경 없음)

infrastructure/di/container.ts        ← [수정] Supabase 분기 추가
  getProjectRepository()              → USE_SUPABASE_REPOS ? Supabase : InMemory
  getProcessStepRepository()          → USE_SUPABASE_REPOS ? Supabase : InMemory
```

### 3.2 기존 Hook/Page 영향

변경 없음. `hooks/projects/useProjects.ts`는 `getProjectRepository()`를 통해 리포지토리를 가져오므로, DI 컨테이너 전환만으로 Supabase 연동 완료.

---

## 4. RLS 정책

```sql
-- projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated and anon" ON projects
  FOR ALL USING (true) WITH CHECK (true);

-- process_steps
ALTER TABLE process_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated and anon" ON process_steps
  FOR ALL USING (true) WITH CHECK (true);
```

현재 MVP 단계에서 `USING(true)` 개방 정책 적용 (기존 materials/procurement과 동일).
인증 시스템 도입 시 `auth.uid()` 기반 정책으로 강화 필요.

---

## 5. 검증 결과

| 항목 | 결과 |
|------|------|
| INSERT (프로젝트) | PJ-2026-001 정상 삽입 |
| INSERT (공정단계) | 2건 삽입, FK 참조 정상 |
| SELECT (JOIN) | 프로젝트별 공정단계 수 조회 정상 |
| UPDATE | status 변경 + updated_at 갱신 정상 |
| DELETE (CASCADE) | 프로젝트 삭제 시 공정단계 자동 삭제 확인 |
| TypeScript | 프로젝트 관련 파일 tsc 에러 없음 |

---

## 6. 향후 확장

| 항목 | 설명 |
|------|------|
| order 관계 | `order_id` FK를 orders 테이블에 연결 (sales 도메인 Supabase 연동 시) |
| manager 관계 | `manager_id` FK를 profiles 테이블에 연결 (admin 도메인 Supabase 연동 시) |
| assignee 관계 | `process_steps.assignee_id` FK를 profiles에 연결 |
| 페이지네이션 | `findPage()` 메서드 추가 (materials 패턴 참고) |
| 실시간 구독 | Supabase Realtime으로 프로젝트 상태 변경 알림 |
