# 8. 데이터베이스 스키마 (Supabase PostgreSQL)

> **Supabase 활용 전략**
> - **Database**: Supabase PostgreSQL — RLS 정책으로 행 수준 접근 제어
> - **Auth**: Supabase Auth — 회원가입/로그인, JWT, `user_metadata`에 role 저장
> - **Storage**: Supabase Storage — 도면/첨부파일 버킷 관리
> - **Realtime**: Supabase Realtime — 작업 현황 변경, 알림 구독
> - **Edge Functions**: 번호 채번, 원가 집계 등 서버 사이드 로직 (필요 시)
>
> 모든 테이블에 RLS 활성화. `auth.uid()` 및 `profiles.role` 기반 정책 적용.

### 8.1 인증 / 사용자 프로필

```sql
-- Supabase Auth의 auth.users 테이블을 확장하는 프로필
-- auth.users와 1:1 관계 (id = auth.uid())
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN (
                'ADMIN','SALES','ENGINEER','PRODUCTION','WORKER','PURCHASE','QC','ACCOUNTING'
              )),
  department  TEXT,
  phone       TEXT,
  hourly_rate NUMERIC(10,2),  -- 인건비 단가 (원가 산출용)
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 신규 가입 시 프로필 자동 생성 (Supabase trigger)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', COALESCE(NEW.raw_user_meta_data->>'role', 'WORKER'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 8.2 고객/영업

```sql
CREATE TABLE customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,                -- 회사명
  business_no     TEXT,                         -- 사업자번호
  representative  TEXT,                         -- 대표자
  address         TEXT,
  phone           TEXT,
  email           TEXT,
  contact_person  TEXT,                         -- 담당자명
  contact_phone   TEXT,                         -- 담당자 연락처
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE quotes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_no        TEXT UNIQUE NOT NULL,         -- QT-2026-001
  customer_id     UUID REFERENCES customers(id),
  title           TEXT NOT NULL,
  version         INT DEFAULT 1,
  status          TEXT NOT NULL CHECK (status IN ('DRAFT','SUBMITTED','ACCEPTED','REJECTED','EXPIRED')),
  valid_until     DATE,
  total_amount    NUMERIC(15,2),
  notes           TEXT,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no        TEXT UNIQUE NOT NULL,         -- SO-2026-001
  quote_id        UUID REFERENCES quotes(id),
  customer_id     UUID REFERENCES customers(id),
  title           TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED')),
  order_date      DATE NOT NULL,
  delivery_date   DATE NOT NULL,                -- 납기일
  total_amount    NUMERIC(15,2),
  notes           TEXT,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

### 8.3 프로젝트/설계

```sql
CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_no      TEXT UNIQUE NOT NULL,         -- PJ-2026-001
  order_id        UUID REFERENCES orders(id),
  name            TEXT NOT NULL,
  mold_type       TEXT NOT NULL CHECK (mold_type IN ('INJECTION','PRESS','DIE_CASTING','BLOW','OTHER')),
  status          TEXT NOT NULL CHECK (status IN (
                    'CONFIRMED','DESIGNING','DESIGN_COMPLETE','MATERIAL_PREP',
                    'MACHINING','ASSEMBLING','TRYOUT','REWORK','FINAL_INSPECTION',
                    'READY_TO_SHIP','SHIPPED','DELIVERED','AS_SERVICE'
                  )),
  priority        TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('HIGH','MEDIUM','LOW')),
  manager_id      UUID REFERENCES profiles(id), -- 프로젝트 담당자
  start_date      DATE,
  due_date        DATE NOT NULL,                -- 납기일
  completed_date  DATE,
  description     TEXT,
  specifications  JSONB,                        -- {cavity_count, material, size, ...}
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE bom_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
  parent_id       UUID REFERENCES bom_items(id),  -- 트리 구조
  material_id     UUID REFERENCES materials(id),
  item_name       TEXT NOT NULL,
  specification   TEXT,
  quantity        NUMERIC(12,4) NOT NULL,
  unit            TEXT NOT NULL,
  unit_price      NUMERIC(12,2),
  remarks         TEXT,
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE design_changes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_no       TEXT UNIQUE NOT NULL,         -- ECO-2026-001
  project_id      UUID REFERENCES projects(id),
  type            TEXT NOT NULL CHECK (type IN ('ECR','ECO')),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  reason          TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('REQUESTED','REVIEWING','APPROVED','REJECTED','COMPLETED')),
  impact          TEXT,                         -- 영향 분석
  requested_by    UUID REFERENCES profiles(id),
  approved_by     UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

### 8.4 생산

```sql
CREATE TABLE process_steps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
  category        TEXT NOT NULL CHECK (category IN ('DESIGN','PRODUCTION','ASSEMBLY','QUALITY')),
  process_code    TEXT NOT NULL,                -- DESIGN_3D, DESIGN_2D, DESIGN_REVIEW, DESIGN_BOM,
                                                -- MATERIAL_PREP, ROUGHING, MCT, EDM, WIRE, GRINDING,
                                                -- HEAT_TREATMENT, ASSEMBLY, TRYOUT, FINAL_INSPECTION
  process_name    TEXT NOT NULL,
  sequence        INT NOT NULL,                 -- 공정 순서
  estimated_hours NUMERIC(8,2),                 -- 예상 소요시간
  machine_id      UUID REFERENCES machines(id), -- 가공 공정용 (설계 시 NULL)
  assignee_id     UUID REFERENCES profiles(id), -- 담당자 (설계자 또는 작업자)
  status          TEXT NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED','IN_PROGRESS','COMPLETED','SKIPPED','ON_HOLD')),
  start_date      DATE,
  end_date        DATE,
  predecessor_id  UUID REFERENCES process_steps(id), -- 선행 공정
  outputs         JSONB,                        -- 산출물 정보
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE work_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_no   TEXT UNIQUE NOT NULL,         -- WO-2026-00001
  process_step_id UUID REFERENCES process_steps(id),
  project_id      UUID REFERENCES projects(id),
  machine_id      UUID REFERENCES machines(id),
  worker_id       UUID REFERENCES profiles(id),
  status          TEXT NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED','READY','IN_PROGRESS','PAUSED','COMPLETED','CANCELLED')),
  planned_start   TIMESTAMPTZ,
  planned_end     TIMESTAMPTZ,
  actual_start    TIMESTAMPTZ,
  actual_end      TIMESTAMPTZ,
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE work_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id   UUID REFERENCES work_orders(id),
  worker_id       UUID REFERENCES profiles(id),
  machine_id      UUID REFERENCES machines(id),
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ,
  duration        NUMERIC(8,2),                 -- 소요시간 (분)
  description     TEXT,
  issues          TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE outsource_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outsource_no    TEXT UNIQUE NOT NULL,         -- OS-2026-001
  project_id      UUID REFERENCES projects(id),
  process_step_id UUID REFERENCES process_steps(id),
  supplier_id     UUID REFERENCES suppliers(id),
  process_type    TEXT NOT NULL,                -- HEAT_TREATMENT, PLATING, COATING, SPECIAL_MACHINING
  status          TEXT NOT NULL CHECK (status IN ('REQUESTED','ORDERED','SHIPPED','RECEIVED','INSPECTED')),
  quantity        NUMERIC(12,4),
  unit_price      NUMERIC(12,2),
  total_price     NUMERIC(15,2),
  request_date    DATE NOT NULL,
  due_date        DATE,
  shipped_date    DATE,
  received_date   DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

### 8.5 자재/재고

```sql
CREATE TABLE materials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_code   TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('STEEL','STANDARD_PART','CONSUMABLE','PURCHASED')),
  accounting_item_type TEXT NOT NULL DEFAULT 'RAW_MATERIAL'
                  CHECK (accounting_item_type IN ('RAW_MATERIAL','SUB_MATERIAL','CONSUMABLE','OUTSOURCE','ASSET')),
                                              -- 품목 마스터 회계처리항목 (원자재/부재료/소모품/외주비/자산)
  purchase_debit_account_id UUID REFERENCES gl_accounts(id),
                                              -- 품목별 입고 차변계정 Override (기본값은 회계처리항목 정책)
  specification   TEXT,
  unit            TEXT NOT NULL,                -- KG, EA, SET, M
  unit_price      NUMERIC(12,2),               -- 최근 단가
  safety_stock    NUMERIC(12,4),               -- 안전재고
  lead_time       INT,                         -- 리드타임 (일)
  supplier_id     UUID REFERENCES suppliers(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE stocks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id     UUID REFERENCES materials(id) UNIQUE,
  location_code   TEXT,                         -- 보관 위치
  quantity        NUMERIC(12,4) NOT NULL DEFAULT 0,
  avg_unit_price  NUMERIC(12,2) NOT NULL DEFAULT 0, -- 이동평균 단가
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE stock_movements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id       UUID REFERENCES materials(id),
  type              TEXT NOT NULL CHECK (type IN ('IN','OUT','ADJUST')),
  quantity          NUMERIC(12,4) NOT NULL,
  unit_price        NUMERIC(12,2),
  project_id        UUID REFERENCES projects(id),        -- 출고 시 프로젝트 연결
  purchase_order_id UUID REFERENCES purchase_orders(id),  -- 입고 시 발주 연결
  reason            TEXT,
  created_by        UUID REFERENCES profiles(id),
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE suppliers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  business_no     TEXT,
  contact_person  TEXT,
  phone           TEXT,
  email           TEXT,
  address         TEXT,
  supplier_type   TEXT CHECK (supplier_type IN ('MATERIAL','OUTSOURCE','BOTH')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE purchase_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_no           TEXT UNIQUE NOT NULL,         -- PO-2026-001
  supplier_id     UUID REFERENCES suppliers(id),
  status          TEXT NOT NULL CHECK (status IN ('DRAFT','ORDERED','PARTIAL_RECEIVED','RECEIVED','CANCELLED')),
  settlement_type TEXT NOT NULL DEFAULT 'CREDIT' CHECK (settlement_type IN ('CREDIT','CASH')),
                                              -- CREDIT=외상매입(매입채무), CASH=현금매입(현금/예금)
  order_date      DATE NOT NULL,
  due_date        DATE,
  total_amount    NUMERIC(15,2),
  notes           TEXT,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

### 8.6 품질

```sql
CREATE TABLE quality_inspections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_no   TEXT UNIQUE NOT NULL,         -- QI-2026-001
  project_id      UUID REFERENCES projects(id),
  type            TEXT NOT NULL CHECK (type IN ('INCOMING','IN_PROCESS','FINAL','TRYOUT')),
  status          TEXT NOT NULL CHECK (status IN ('PLANNED','IN_PROGRESS','PASS','FAIL','CONDITIONAL')),
  inspector       UUID REFERENCES profiles(id),
  inspection_date TIMESTAMPTZ,
  results         JSONB,                        -- 측정 데이터
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tryouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES projects(id),
  tryout_no       INT NOT NULL,                 -- 차수 (1, 2, 3...)
  date            TIMESTAMPTZ,
  machine         TEXT,                         -- 사출기/프레스 정보
  conditions      JSONB,                        -- 성형 조건
  results         TEXT,
  issues          TEXT,
  corrections     TEXT,
  status          TEXT NOT NULL CHECK (status IN ('PLANNED','COMPLETED','APPROVED')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, tryout_no)
);
```

### 8.7 설비

```sql
CREATE TABLE machines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_code    TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL,                -- MCT, EDM, WIRE_EDM, GRINDING, CNC_LATHE
  manufacturer    TEXT,
  model           TEXT,
  status          TEXT DEFAULT 'IDLE' CHECK (status IN ('RUNNING','IDLE','MAINTENANCE','BREAKDOWN')),
  location        TEXT,
  hourly_rate     NUMERIC(10,2),                -- 시간당 단가 (원가 배부용)
  purchase_date   DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

### 8.8 시스템 공통

```sql
-- 파일 첨부 (Supabase Storage 메타데이터)
CREATE TABLE attachments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     TEXT NOT NULL,                -- PROJECT, QUOTE, QUALITY, PROCESS_STEP 등
  entity_id       UUID NOT NULL,
  file_name       TEXT NOT NULL,
  storage_path    TEXT NOT NULL,                -- Supabase Storage 경로
  file_size       INT,
  mime_type       TEXT,
  uploaded_by     UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 감사 로그
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES profiles(id),
  action          TEXT NOT NULL,                -- CREATE, UPDATE, DELETE
  entity_type     TEXT NOT NULL,
  entity_id       UUID NOT NULL,
  changes         JSONB,                        -- {before: {...}, after: {...}}
  ip_address      INET,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- updated_at 자동 갱신 트리거 (모든 테이블에 적용)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 예: projects 테이블에 적용
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- (customers, quotes, orders, process_steps, work_orders, materials, stocks,
--  purchase_orders, machines, suppliers, design_changes 등 모든 테이블에 동일 적용)
```

### 8.9 RLS 정책 예시

```sql
-- 모든 테이블에 RLS 활성화
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 로그인 사용자 전체 조회 허용 (역할별 세분화는 점진 적용)
CREATE POLICY "Authenticated users can read projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

-- 생성: 영업, 관리자만 가능
CREATE POLICY "Sales and Admin can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('ADMIN','SALES')
  );

-- 수정: 담당자 또는 관리자
CREATE POLICY "Manager or Admin can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    manager_id = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN'
  );

-- Supabase Storage 버킷 정책 (도면 파일)
-- Bucket: 'attachments'
-- 정책: authenticated 사용자 업로드/다운로드 허용
```

### 8.10 Supabase Storage 버킷 구조

```
attachments/
├── projects/{project_id}/
│   ├── drawings/        -- 2D/3D 도면
│   ├── documents/       -- 사양서, 기타 문서
│   └── photos/          -- 현장 사진
├── quotes/{quote_id}/   -- 견적 관련 파일
├── quality/{inspection_id}/ -- 검사 성적서, 측정 데이터
└── tryouts/{tryout_id}/ -- 트라이아웃 사진/결과
```

### 8.11 회계/원장 (자동연동)

```sql
-- 계정과목(Chart of Accounts)
CREATE TABLE gl_accounts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code              TEXT UNIQUE NOT NULL,             -- 1100, 1200, 2100 ...
  name              TEXT NOT NULL,                    -- 매출채권, 매입채무, 원재료, 재공품, 제품, 매출, 매출원가 등
  type              TEXT NOT NULL CHECK (type IN ('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE')),
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- 회계처리항목별 기본 계정 정책
CREATE TABLE accounting_item_policies (
  accounting_item_type        TEXT PRIMARY KEY
    CHECK (accounting_item_type IN ('RAW_MATERIAL','SUB_MATERIAL','CONSUMABLE','OUTSOURCE','ASSET')),
  name                        TEXT NOT NULL,      -- 원자재, 부재료, 소모품, 외주비, 자산
  purchase_debit_account_id   UUID REFERENCES gl_accounts(id),  -- 입고 시 차변 기본계정
  issue_credit_account_id     UUID REFERENCES gl_accounts(id),  -- 출고 시 대변 기본계정(예: 원자재)
  wip_debit_account_id        UUID REFERENCES gl_accounts(id),  -- 출고 시 차변 기본계정(예: 재공품)
  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now()
);

-- 회계기간(월 마감)
CREATE TABLE fiscal_periods (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_year       INT NOT NULL,
  period_month      INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  status            TEXT NOT NULL CHECK (status IN ('OPEN','CLOSED')),
  closed_at         TIMESTAMPTZ,
  closed_by         UUID REFERENCES profiles(id),
  UNIQUE(period_year, period_month)
);

-- 원천 이벤트 로그 (멱등 처리 키)
CREATE TABLE accounting_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type       TEXT NOT NULL,                    -- ORDER, PAYMENT, PURCHASE_ORDER, STOCK_MOVEMENT, PROJECT, WORK_ORDER
  source_id         UUID NOT NULL,
  event_type        TEXT NOT NULL,                    -- ORDER_CONFIRMED, PAYMENT_CONFIRMED, PO_ORDERED, STOCK_OUT ...
  occurred_at       TIMESTAMPTZ NOT NULL,
  payload           JSONB NOT NULL,                   -- 계산 근거 스냅샷(단가, 수량, 참조번호)
  status            TEXT NOT NULL DEFAULT 'POSTED' CHECK (status IN ('POSTED','REVERSED','ERROR')),
  error_message     TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_type, source_id, event_type)
);

-- 전표 헤더
CREATE TABLE journal_entries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_no        TEXT UNIQUE NOT NULL,             -- JE-2026-000001
  posting_date      DATE NOT NULL,
  fiscal_period_id  UUID REFERENCES fiscal_periods(id),
  source_type       TEXT NOT NULL,
  source_id         UUID NOT NULL,
  source_no         TEXT,                             -- order_no, po_no, wo_no 등
  description       TEXT,
  status            TEXT NOT NULL DEFAULT 'POSTED' CHECK (status IN ('POSTED','REVERSED')),
  reversed_entry_id UUID REFERENCES journal_entries(id),
  created_by        UUID REFERENCES profiles(id),
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- 전표 라인(복식부기)
CREATE TABLE journal_lines (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id  UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  line_no           INT NOT NULL,
  account_id        UUID REFERENCES gl_accounts(id),
  dr_amount         NUMERIC(15,2) NOT NULL DEFAULT 0,
  cr_amount         NUMERIC(15,2) NOT NULL DEFAULT 0,
  project_id        UUID REFERENCES projects(id),
  customer_id       UUID REFERENCES customers(id),
  supplier_id       UUID REFERENCES suppliers(id),
  material_id       UUID REFERENCES materials(id),
  memo              TEXT,
  CHECK ((dr_amount = 0 AND cr_amount > 0) OR (cr_amount = 0 AND dr_amount > 0)),
  UNIQUE(journal_entry_id, line_no)
);

-- 매출채권 보조원장(Open Item)
CREATE TABLE ar_open_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID REFERENCES orders(id),
  customer_id       UUID REFERENCES customers(id),
  journal_line_id   UUID REFERENCES journal_lines(id),
  due_date          DATE,
  original_amount   NUMERIC(15,2) NOT NULL,
  balance_amount    NUMERIC(15,2) NOT NULL,
  status            TEXT NOT NULL CHECK (status IN ('OPEN','PARTIAL','CLOSED')),
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- 매입채무 보조원장(Open Item)
CREATE TABLE ap_open_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  supplier_id       UUID REFERENCES suppliers(id),
  journal_line_id   UUID REFERENCES journal_lines(id),
  due_date          DATE,
  original_amount   NUMERIC(15,2) NOT NULL,
  balance_amount    NUMERIC(15,2) NOT NULL,
  status            TEXT NOT NULL CHECK (status IN ('OPEN','PARTIAL','CLOSED')),
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_journal_entries_posting_date ON journal_entries(posting_date);
CREATE INDEX idx_journal_lines_account_id ON journal_lines(account_id);
CREATE INDEX idx_journal_lines_project_id ON journal_lines(project_id);
CREATE INDEX idx_ar_open_items_customer_id ON ar_open_items(customer_id);
CREATE INDEX idx_ap_open_items_supplier_id ON ap_open_items(supplier_id);
CREATE INDEX idx_accounting_events_source ON accounting_events(source_type, source_id, event_type);
```

---

