# 자재 품목 분류별 관리 확장 계획

> **문서 버전**: v1.3
> **작성일**: 2026-02-09
> **기준 문서**: PRD.md 섹션 3.5, 7.4

---

## 1. 배경 및 목적

### 1.1 문제 정의

금형 제조 현장에서 관리하는 품목은 크게 5가지로 나뉜다:

| 품목 유형 | 현장 예시 | 현재 시스템 |
|----------|----------|------------|
| **강재 (원자재)** | NAK80, SKD11, SKD61, S45C | `STEEL` 카테고리 존재, 치수/중량 관리 없음 |
| **공구** | 엔드밀, 드릴, 탭, 방전 전극, 연마석, 인서트 | **카테고리 없음** — CONSUMABLE로 혼재 관리 |
| **소모품** | 절삭유, 와이어(방전), 연마재, 필터, 쿨런트 | `CONSUMABLE` 존재, 소비 추적 없음 |
| **표준부품** | 이젝터 핀, 가이드 핀/부시, 스프링, 볼트 | `STANDARD_PART` 존재, 기본 관리만 |
| **구매품** | 핫러너 시스템, 온도 컨트롤러, 유압 실린더 | `PURCHASED` 존재, 기본 관리만 |

**현재 한계:**

```
MaterialCategory = 'STEEL' | 'STANDARD_PART' | 'CONSUMABLE' | 'PURCHASED'
```

1. **공구(TOOL)** 카테고리가 없어 소모품으로 혼재 관리됨
2. **STEEL**: 치수(W×L×H)/밀도/중량 구조화 없음, 체적중량 단가 계산 불가
3. **STEEL 이중 단위 미지원**: 구매는 KG, 현장 관리는 태그 부착 EA — 현재 하나의 단위만 지원
4. **STEEL 개별 추적 불가**: 절단된 강재를 개별 태그로 추적하는 구조 없음
5. **TOOL**: 공구 유형/직경/수명/재연마 추적 불가
6. **CONSUMABLE**: 소비 단위/소비율/최소발주량 추적 없음
7. 모든 카테고리가 동일한 등록 폼을 사용 — 카테고리별 특화 입력 없음

### 1.2 HMLV 원자재 특성

금형 제조업은 **HMLV (High Mix Low Volume)** 특성을 갖는다:

- **절단된 사이즈로 구매**: 원자재(강재)를 업체에서 직접 절단하지 않고, 공급처에서 프로젝트별 치수로 절단·가공된 상태로 납품받음
- **재사용성 극히 낮음**: 각 강재는 특정 프로젝트의 특정 금형 부품 용도로 절단되어, 다른 프로젝트에 전용하기 어려움
- **구매 ↔ 관리 단위 불일치**: 공급처와의 거래(발주·단가·정산)는 **KG 기준**, 현장에서의 물리적 관리(보관·출고·프로젝트 할당)는 **태그 부착 EA 기준**
- **개별 추적 필요**: 각 강재 덩어리에 태그(고유번호)를 부착하여 입고→보관→출고→사용 이력을 1:1로 추적

### 1.3 목표

- 카테고리를 **5종**으로 확장: `STEEL | TOOL | CONSUMABLE | STANDARD_PART | PURCHASED`
- 각 카테고리별 **전용 속성** 추가 (optional 필드)
- 자재 등록/상세 UI에서 **카테고리 선택 시 조건부 입력 폼** 표시
- **STEEL 이중 단위**: 발주는 KG, 재고 관리는 태그 부착 EA
- **STEEL 태그 관리**: 개별 강재에 태그 번호를 부여하여 입고~사용까지 전 생애주기 추적
- **TOOL**: 공구 유형/직경/재질/수명 관리
- **CONSUMABLE**: 소비 단위/최소발주량 관리
- 기존 `STANDARD_PART`, `PURCHASED`는 큰 변경 없이 규격 필드 활용

---

## 2. 카테고리별 상세 정의

### 2.1 STEEL (강재/원자재) — 이중 단위 관리

금형 강재를 **KG(구매) / 태그 EA(재고)** 이중 단위로 관리한다.

#### 2.1.1 관리 모델 개요

```
┌─────────────────────────────────────────────────────────────┐
│                    STEEL 관리 흐름                           │
│                                                             │
│  [자재 마스터]  →  [발주(PO)]  →  [입고]  →  [재고]  →  [출고]  │
│   강종/치수/      KG 단위       태그 부여    태그 EA    프로젝트  │
│   kg당 단가       총 중량 기준   개별 칭량    개별 추적  할당     │
│                                                             │
│  단위: KG ─────────────────→  단위: EA (태그) ──────────────→  │
│        (구매/정산 기준)              (현장 관리 기준)           │
└─────────────────────────────────────────────────────────────┘
```

#### 2.1.2 마스터 정보 (Material)

| 항목 | 설명 |
|------|------|
| **구매 단위** | KG — 발주서·단가·정산 모두 KG 기준 |
| **재고 단위** | EA — 태그 부착된 개별 강재 1건 = 1 EA |
| **단가 기준** | 원/kg (price_per_kg) |
| **핵심 속성** | 강종, 밀도, 치수(W×L×H), 이론 중량, kg당 단가, **중량 방식** |
| **자동 계산** | `weight = density × W × L × H / 1,000,000` (이론 중량, kg) |
| **참고 단가** | `unit_price = weight × price_per_kg` (1건당 참고 금액) |
| **중량 방식** | `MEASURED`(실측) — 입고 시 개별 칭량 필수 / `CALCULATED`(계산) — 이론 중량 자동 적용 |

#### 2.1.3 발주 흐름 (KG 기반)

```
발주서 예시:
───────────────────────────────────────
품목: NAK80 (400×300×350mm)
이론 중량: 329.70 kg/EA
───────────────────────────────────────
발주 수량: 3 EA  →  총 중량: 989.10 kg
kg당 단가: 8,500원/kg
발주 금액: 8,407,350원
───────────────────────────────────────
```

- 발주 시 **EA 수량**을 입력하면 → **총 중량(KG)** 자동 계산
- 단가·정산은 `총 중량(kg) × kg당 단가`로 계산
- 발주서에는 KG 기준 금액 표기

#### 2.1.4 입고 흐름 (태그 부여) — 중량 방식별 분기

자재 마스터의 `weight_method` 설정에 따라 입고 시 중량 처리가 달라진다:

**A. 실측 방식 (`MEASURED`) — 입고 시 개별 칭량:**

```
입고 처리 (실측):
───────────────────────────────────────
발주: PO-2026-001 | NAK80 (400×300×350)
중량 방식: 실측 (MEASURED)
입고 수량: 3 EA
───────────────────────────────────────
태그 #1: NAK80-2602-001  실측 [328.5] kg  ← 수기 입력
태그 #2: NAK80-2602-002  실측 [330.1] kg  ← 수기 입력
태그 #3: NAK80-2602-003  실측 [329.8] kg  ← 수기 입력
───────────────────────────────────────
총 중량: 988.4 kg (이론: 989.1 kg, 차이: -0.7 kg)
```

- 각 태그별 **중량 수기 입력 필수**
- 이론 중량 대비 차이 표시 (품질 확인용)

**B. 계산 방식 (`CALCULATED`) — 이론 중량 자동 적용:**

```
입고 처리 (계산값):
───────────────────────────────────────
발주: PO-2026-001 | S45C (300×200×150)
중량 방식: 계산 (CALCULATED)
입고 수량: 5 EA
───────────────────────────────────────
태그 #1: S45C-2602-001  이론 70.65 kg  ✓ (자동)
태그 #2: S45C-2602-002  이론 70.65 kg  ✓ (자동)
태그 #3: S45C-2602-003  이론 70.65 kg  ✓ (자동)
태그 #4: S45C-2602-004  이론 70.65 kg  ✓ (자동)
태그 #5: S45C-2602-005  이론 70.65 kg  ✓ (자동)
───────────────────────────────────────
총 중량: 353.25 kg (이론값 적용)
```

- 이론 중량(계산값)이 각 태그에 **자동 적용** — 별도 입력 불필요
- 필요 시 수기 수정 가능 (예외 상황)

**공통:**
- 입고 시 **개별 강재마다 태그 번호 자동 부여** (수동 변경 가능)
- 태그 번호 형식: `{강종}-{YYMM}-{3자리 시퀀스}` (예: `NAK80-2602-001`)

#### 2.1.5 재고 관리 (태그 EA 기반)

| 태그 번호 | 강종 | 치수 | 중량 | 상태 | 할당 프로젝트 | 보관 위치 |
|----------|------|------|----------|------|-------------|----------|
| NAK80-2602-001 | NAK80 | 400×300×350 | 328.5 kg | 가용 | — | A-1-3 |
| NAK80-2602-002 | NAK80 | 400×300×350 | 330.1 kg | 할당됨 | P-2026-003 | B-2-1 |
| NAK80-2602-003 | NAK80 | 400×300×350 | 329.8 kg | 사용중 | P-2026-005 | 가공기 |

- 재고 현황은 **태그 단위**로 표시 (어떤 강재가 어디에 있는지)
- 상태: `AVAILABLE(가용)` → `ALLOCATED(할당)` → `IN_USE(사용중)` → `USED(사용완료)` / `SCRAP(폐기)`
- 프로젝트에 할당·출고 시 태그 지정

#### 2.1.6 강종별 밀도 참고값

| 강종 | 밀도 (g/cm³) | 용도 |
|------|-------------|------|
| NAK80 | 7.85 | 사출금형 코어/캐비티 |
| SKD11 | 7.70 | 프레스금형 펀치/다이 |
| SKD61 | 7.76 | 다이캐스팅 금형 |
| S45C | 7.85 | 금형 베이스, 홀더 |
| SUS304 | 7.93 | 내식성 부품 |
| SCM440 | 7.85 | 고강도 부품 |
| P20 | 7.85 | 대형 사출금형 |
| STAVAX | 7.80 | 경면/내식 금형 |

### 2.2 TOOL (공구)

절삭/가공에 사용되는 공구를 수명·재연마 기반으로 관리한다.

| 항목 | 설명 |
|------|------|
| **관리 단위** | EA |
| **단가 기준** | 원/EA |
| **핵심 속성** | 공구 유형, 직경, 전장, 최대 수명, 최대 재연마 횟수 |
| **소모 추적** | 프로젝트별 공구 출고 → 사용 이력 (향후) |

**공구 유형 (TOOL_TYPE):**

| 코드 | 명칭 | 설명 | 단위 |
|------|------|------|------|
| `END_MILL` | 엔드밀 | MCT/CNC 절삭 | EA |
| `DRILL` | 드릴 | 구멍 가공 | EA |
| `TAP` | 탭 | 나사 가공 | EA |
| `INSERT` | 인서트 | 교체식 절삭 팁 | EA |
| `ELECTRODE` | 방전 전극 | EDM 방전 가공 (동, 그라파이트) | EA |
| `GRINDING_WHEEL` | 연마석 | 평면/원통 연마 | EA |
| `REAMER` | 리머 | 정밀 구멍 가공 | EA |
| `TOOL_OTHER` | 기타 공구 | 분류 외 공구 | EA |

### 2.3 CONSUMABLE (소모품)

가공 과정에서 소비되는 재료를 단위·소비율 기반으로 관리한다.

| 항목 | 설명 |
|------|------|
| **관리 단위** | KG, L, M, ROLL, EA 등 (품목별 상이) |
| **단가 기준** | 원/단위 |
| **핵심 속성** | 소비 단위, 최소 발주 수량 |
| **소비 추적** | 정기 소비, 안전재고 미달 시 자동 경고 |

**주요 소모품 예시:**

| 품목 | 단위 | 안전재고 기준 |
|------|------|-------------|
| 절삭유 (수용성) | L | 20L |
| 절삭유 (유성) | L | 10L |
| 방전 와이어 (황동) | ROLL (10kg/roll) | 5 ROLL |
| 방전 와이어 (몰리브덴) | ROLL | 2 ROLL |
| 연마재 (다이아몬드 페이스트) | EA (튜브) | 5 EA |
| 쿨런트 | L | 50L |
| 필터 (오일 미스트) | EA | 10 EA |
| 세척제 | L | 5L |

### 2.4 STANDARD_PART (표준부품)

규격화된 금형 부품을 수량 기반으로 관리한다.

| 항목 | 설명 |
|------|------|
| **관리 단위** | EA / SET |
| **단가 기준** | 원/EA or 원/SET |
| **핵심 속성** | 규격(specification) 필드 활용 |
| **변경사항** | 최소 — 기존 구조 유지 |

**예시:** 이젝터 핀 세트, 가이드 핀/부시, 리턴 스프링, O링, 볼트/너트

### 2.5 PURCHASED (구매품)

외부에서 완제품으로 구매하는 고가 부품을 관리한다.

| 항목 | 설명 |
|------|------|
| **관리 단위** | EA / SET |
| **단가 기준** | 원/EA or 원/SET |
| **핵심 속성** | 규격(specification) 필드 활용 |
| **변경사항** | 최소 — 기존 구조 유지 |

**예시:** 핫러너 시스템, 유압 실린더, 온도 컨트롤러, 특수 표준금형 부품

---

## 3. 데이터 모델 변경

### 3.1 TypeScript 타입 확장

```typescript
// types/index.ts

// ── 카테고리 확장 ──
export type MaterialCategory = 'STEEL' | 'TOOL' | 'CONSUMABLE' | 'STANDARD_PART' | 'PURCHASED';

export const MATERIAL_CATEGORY_MAP: Record<MaterialCategory, string> = {
  STEEL: '강재',
  TOOL: '공구',
  CONSUMABLE: '소모품',
  STANDARD_PART: '표준부품',
  PURCHASED: '구매품',
};

// ── 공구 유형 ──
export type ToolType =
  | 'END_MILL' | 'DRILL' | 'TAP' | 'INSERT'
  | 'ELECTRODE' | 'GRINDING_WHEEL' | 'REAMER' | 'TOOL_OTHER';

export const TOOL_TYPE_MAP: Record<ToolType, string> = {
  END_MILL: '엔드밀',
  DRILL: '드릴',
  TAP: '탭',
  INSERT: '인서트',
  ELECTRODE: '방전 전극',
  GRINDING_WHEEL: '연마석',
  REAMER: '리머',
  TOOL_OTHER: '기타 공구',
};

// ── STEEL 중량 방식 ──
export type SteelWeightMethod = 'MEASURED' | 'CALCULATED';

export const STEEL_WEIGHT_METHOD_MAP: Record<SteelWeightMethod, string> = {
  MEASURED: '실측 (입고 시 칭량)',
  CALCULATED: '계산 (이론 중량 적용)',
};

// ── 강종 밀도 ──
export const STEEL_GRADE_DENSITY: Record<string, number> = {
  'NAK80': 7.85,
  'SKD11': 7.70,
  'SKD61': 7.76,
  'S45C': 7.85,
  'SUS304': 7.93,
  'SCM440': 7.85,
  'P20': 7.85,
  'STAVAX': 7.80,
};

// ── 강재 태그 상태 ──
export type SteelTagStatus = 'AVAILABLE' | 'ALLOCATED' | 'IN_USE' | 'USED' | 'SCRAP';

export const STEEL_TAG_STATUS_MAP: Record<SteelTagStatus, string> = {
  AVAILABLE: '가용',
  ALLOCATED: '할당됨',
  IN_USE: '사용중',
  USED: '사용완료',
  SCRAP: '폐기',
};

// ── Material 인터페이스 확장 ──
export interface Material {
  id: string;
  material_code: string;
  name: string;
  category: MaterialCategory;
  specification?: string;
  unit: string;               // 구매 단위 (STEEL: KG, TOOL: EA, ...)
  inventory_unit?: string;    // 재고 관리 단위 (STEEL: EA — 태그 개별 추적)
  unit_price?: number;
  safety_stock?: number;
  lead_time?: number;
  supplier_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;

  // ── STEEL 전용 (체적중량 + 이중 단위) ──
  steel_grade?: string;       // 강종 (NAK80, SKD11, ...)
  density?: number;           // 밀도 (g/cm³)
  dimension_w?: number;       // 가로 (mm)
  dimension_l?: number;       // 세로 (mm)
  dimension_h?: number;       // 높이 (mm)
  weight?: number;            // 이론 중량 per EA (kg)
  price_per_kg?: number;      // kg당 단가 (원/kg)
  weight_method?: SteelWeightMethod; // 중량 방식: MEASURED(실측) | CALCULATED(계산)

  // ── TOOL 전용 (공구) ──
  tool_type?: ToolType;       // 공구 유형
  tool_diameter?: number;     // 직경 (mm)
  tool_length?: number;       // 전장 (mm)
  max_usage_count?: number;   // 최대 사용 수명 (회)
  regrind_max?: number;       // 최대 재연마 횟수

  // ── CONSUMABLE 전용 (소모품) ──
  min_order_qty?: number;     // 최소 발주 수량
}

// ── 강재 태그 (개별 강재 추적) ──
export interface SteelTag {
  id: string;
  material_id: string;            // 원자재 마스터 참조
  tag_no: string;                 // 태그 번호 (NAK80-2602-001)
  weight: number;                 // 중량 (kg) — 실측 또는 이론값
  status: SteelTagStatus;         // 가용/할당/사용중/사용완료/폐기
  project_id?: string;            // 할당된 프로젝트
  purchase_order_id?: string;     // 입고된 발주 참조
  location?: string;              // 보관 위치 (예: A-1-3)
  received_at: string;            // 입고일
  issued_at?: string;             // 출고일
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

### 3.2 유틸리티 함수

```typescript
// lib/utils.ts — 추가

/** STEEL 체적중량 계산 (kg) */
export function calcSteelWeight(
  density: number, w: number, l: number, h: number
): number {
  // volume(cm³) = w/10 × l/10 × h/10, weight(kg) = density × volume / 1000
  // 간소화: density × w × l × h / 1,000,000
  return density * w * l * h / 1_000_000;
}

/** STEEL 건당 단가 계산 (원) */
export function calcSteelPrice(weightKg: number, pricePerKg: number): number {
  return Math.round(weightKg * pricePerKg);
}

/** STEEL 태그 번호 자동 생성 */
export function generateSteelTagNo(
  steelGrade: string,
  sequence: number,
  date?: Date
): string {
  const d = date || new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const seq = String(sequence).padStart(3, '0');
  return `${steelGrade}-${yy}${mm}-${seq}`;
}

/** 발주 수량(EA) → 총 중량(KG) 환산 */
export function calcTotalWeight(qtyEa: number, weightPerEa: number): number {
  return Math.round(qtyEa * weightPerEa * 100) / 100;
}

/** 총 중량(KG) → 발주 금액 계산 */
export function calcSteelOrderAmount(totalWeightKg: number, pricePerKg: number): number {
  return Math.round(totalWeightKg * pricePerKg);
}
```

### 3.3 Supabase 마이그레이션

```sql
-- 마이그레이션: extend_materials_category_and_steel_tags

-- ═══════════════════════════════════════════════════════
-- 1) materials 테이블 확장
-- ═══════════════════════════════════════════════════════

-- 1-1) category CHECK 제약조건 수정 (TOOL 추가)
ALTER TABLE public.materials DROP CONSTRAINT IF EXISTS materials_category_check;
ALTER TABLE public.materials ADD CONSTRAINT materials_category_check
  CHECK (category IN ('STEEL','TOOL','CONSUMABLE','STANDARD_PART','PURCHASED'));

-- 1-2) 공통: 재고 관리 단위 (STEEL의 경우 unit=KG, inventory_unit=EA)
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS inventory_unit TEXT;

COMMENT ON COLUMN public.materials.inventory_unit IS '재고 관리 단위 (STEEL: EA — 태그 개별 추적)';

-- 1-3) STEEL 전용 컬럼
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS steel_grade   TEXT,
  ADD COLUMN IF NOT EXISTS density       NUMERIC(6,3),
  ADD COLUMN IF NOT EXISTS dimension_w   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS dimension_l   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS dimension_h   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS weight        NUMERIC(12,4),
  ADD COLUMN IF NOT EXISTS price_per_kg  NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS weight_method TEXT DEFAULT 'MEASURED'
    CHECK (weight_method IN ('MEASURED','CALCULATED'));

-- 1-4) TOOL 전용 컬럼
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS tool_type        TEXT,
  ADD COLUMN IF NOT EXISTS tool_diameter    NUMERIC(8,3),
  ADD COLUMN IF NOT EXISTS tool_length      NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS max_usage_count  INTEGER,
  ADD COLUMN IF NOT EXISTS regrind_max      INTEGER;

-- 1-5) CONSUMABLE 전용 컬럼
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS min_order_qty NUMERIC(12,4);

-- 1-6) COMMENTS
COMMENT ON COLUMN public.materials.steel_grade     IS '강종 (NAK80, SKD11 등)';
COMMENT ON COLUMN public.materials.density         IS '밀도 (g/cm³)';
COMMENT ON COLUMN public.materials.dimension_w     IS '가로 (mm)';
COMMENT ON COLUMN public.materials.dimension_l     IS '세로 (mm)';
COMMENT ON COLUMN public.materials.dimension_h     IS '높이 (mm)';
COMMENT ON COLUMN public.materials.weight          IS '이론 중량 per EA (kg)';
COMMENT ON COLUMN public.materials.price_per_kg    IS 'kg당 단가 (원/kg)';
COMMENT ON COLUMN public.materials.weight_method   IS '중량 방식: MEASURED(실측 칭량) / CALCULATED(이론 계산값)';
COMMENT ON COLUMN public.materials.tool_type       IS '공구 유형 (END_MILL, DRILL, ...)';
COMMENT ON COLUMN public.materials.tool_diameter   IS '공구 직경 (mm)';
COMMENT ON COLUMN public.materials.tool_length     IS '공구 전장 (mm)';
COMMENT ON COLUMN public.materials.max_usage_count IS '최대 사용 수명 (회)';
COMMENT ON COLUMN public.materials.regrind_max     IS '최대 재연마 횟수';
COMMENT ON COLUMN public.materials.min_order_qty   IS '최소 발주 수량';

-- 1-7) 인덱스
CREATE INDEX IF NOT EXISTS idx_materials_tool_type ON public.materials(tool_type)
  WHERE tool_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_materials_steel_grade ON public.materials(steel_grade)
  WHERE steel_grade IS NOT NULL;

-- ═══════════════════════════════════════════════════════
-- 2) steel_tags 테이블 신규 생성 (강재 개별 태그 추적)
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.steel_tags (
  id              TEXT PRIMARY KEY,
  material_id     TEXT NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  tag_no          TEXT NOT NULL UNIQUE,
  weight          NUMERIC(12,4) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'AVAILABLE'
                    CHECK (status IN ('AVAILABLE','ALLOCATED','IN_USE','USED','SCRAP')),
  project_id      TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
  purchase_order_id TEXT REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  location        TEXT,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  issued_at       TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.steel_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on steel_tags" ON public.steel_tags
  FOR ALL USING (true) WITH CHECK (true);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_steel_tags_material_id ON public.steel_tags(material_id);
CREATE INDEX IF NOT EXISTS idx_steel_tags_status ON public.steel_tags(status);
CREATE INDEX IF NOT EXISTS idx_steel_tags_project_id ON public.steel_tags(project_id)
  WHERE project_id IS NOT NULL;

-- updated_at 트리거
CREATE TRIGGER set_updated_at_steel_tags
  BEFORE UPDATE ON public.steel_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.steel_tags IS '강재 개별 태그 — 입고된 강재를 1건씩 추적';
COMMENT ON COLUMN public.steel_tags.tag_no IS '태그 번호 (NAK80-2602-001)';
COMMENT ON COLUMN public.steel_tags.weight IS '중량 (kg) — 실측 또는 이론값';
COMMENT ON COLUMN public.steel_tags.status IS 'AVAILABLE/ALLOCATED/IN_USE/USED/SCRAP';
COMMENT ON COLUMN public.steel_tags.location IS '보관 위치 (예: A-1-3)';
```

### 3.4 기존 데이터 마이그레이션

```sql
-- STEEL 자재: 구조화 필드 + inventory_unit 설정

-- mat1 (NAK80): 대형 블록 — 실측 칭량
UPDATE materials SET
  inventory_unit = 'EA', weight_method = 'MEASURED',
  steel_grade = 'NAK80', density = 7.85,
  dimension_w = 400, dimension_l = 300, dimension_h = 350,
  weight = ROUND(7.85 * 400 * 300 * 350 / 1000000.0, 4),
  price_per_kg = ROUND(unit_price / NULLIF(7.85 * 400 * 300 * 350 / 1000000.0, 0), 0)
WHERE id = 'mat1';

-- mat2 (SKD11): 대형 블록 — 실측 칭량
UPDATE materials SET
  inventory_unit = 'EA', weight_method = 'MEASURED',
  steel_grade = 'SKD11', density = 7.70,
  dimension_w = 500, dimension_l = 400, dimension_h = 300,
  weight = ROUND(7.70 * 500 * 400 * 300 / 1000000.0, 4),
  price_per_kg = ROUND(unit_price / NULLIF(7.70 * 500 * 400 * 300 / 1000000.0, 0), 0)
WHERE id = 'mat2';

-- mat3 (SKD61): 정형 블록 — 계산값 적용
UPDATE materials SET
  inventory_unit = 'EA', weight_method = 'CALCULATED',
  steel_grade = 'SKD61', density = 7.76,
  dimension_w = 600, dimension_l = 500, dimension_h = 350,
  weight = ROUND(7.76 * 600 * 500 * 350 / 1000000.0, 4),
  price_per_kg = ROUND(unit_price / NULLIF(7.76 * 600 * 500 * 350 / 1000000.0, 0), 0)
WHERE id = 'mat3';

-- 방전 와이어: min_order_qty 추가
UPDATE materials SET min_order_qty = 5 WHERE id = 'mat8';

-- 기존 STEEL 자재에 대한 태그 데이터 (재고가 있는 경우)
INSERT INTO steel_tags (id, material_id, tag_no, weight, status, location, received_at) VALUES
  ('stag1', 'mat1', 'NAK80-2601-001', 328.50, 'IN_USE', 'MCT-1', '2026-01-15'),
  ('stag2', 'mat1', 'NAK80-2601-002', 330.10, 'AVAILABLE', 'A-1-3', '2026-01-15'),
  ('stag3', 'mat2', 'SKD11-2601-001', 460.80, 'USED', NULL, '2026-01-10'),
  ('stag4', 'mat2', 'SKD11-2602-001', 463.20, 'AVAILABLE', 'A-2-1', '2026-02-03'),
  ('stag5', 'mat3', 'SKD61-2601-001', 813.50, 'ALLOCATED', 'B-1-2', '2026-01-20');
```

### 3.5 Mock 데이터 확장

```typescript
// lib/mock-data.ts — 기존 수정 + 신규 추가

// ── STEEL 자재 수정 (이중 단위 반영) ──

// mat1 (NAK80) 수정 — 실측 칭량
{ ...기존, unit: 'KG', inventory_unit: 'EA', weight_method: 'MEASURED',
  steel_grade: 'NAK80', density: 7.85,
  dimension_w: 400, dimension_l: 300, dimension_h: 350,
  weight: 329.7, price_per_kg: 7584 }

// mat2 (SKD11) 수정 — 실측 칭량
{ ...기존, unit: 'KG', inventory_unit: 'EA', weight_method: 'MEASURED',
  steel_grade: 'SKD11', density: 7.70,
  dimension_w: 500, dimension_l: 400, dimension_h: 300,
  weight: 462.0, price_per_kg: 6926 }

// mat3 (SKD61) 수정 — 계산값 적용
{ ...기존, unit: 'KG', inventory_unit: 'EA', weight_method: 'CALCULATED',
  steel_grade: 'SKD61', density: 7.76,
  dimension_w: 600, dimension_l: 500, dimension_h: 350,
  weight: 814.8, price_per_kg: 5032 }

// mat8 (와이어) 수정
{ ...기존, min_order_qty: 5 }

// ── 공구 신규 추가 ──
{ id: 'mat9', material_code: 'TL-EM-010',
  name: '초경 엔드밀 Φ10',
  category: 'TOOL',
  specification: 'Φ10 × 75L 4날',
  unit: 'EA', unit_price: 45000,
  safety_stock: 10, lead_time: 3,
  supplier_id: 'sup2',
  tool_type: 'END_MILL', tool_diameter: 10, tool_length: 75,
  max_usage_count: 500, regrind_max: 3,
  ... }

{ id: 'mat10', material_code: 'TL-DR-085',
  name: 'HSS 드릴 Φ8.5',
  category: 'TOOL',
  specification: 'Φ8.5 × 117L',
  unit: 'EA', unit_price: 12000,
  safety_stock: 20, lead_time: 2,
  supplier_id: 'sup2',
  tool_type: 'DRILL', tool_diameter: 8.5, tool_length: 117,
  max_usage_count: 200, regrind_max: 5,
  ... }

{ id: 'mat11', material_code: 'TL-EDM-CU-01',
  name: '동 전극 (커넥터 리브)',
  category: 'TOOL',
  specification: '가공용 동 전극',
  unit: 'EA', unit_price: 85000,
  safety_stock: 0, lead_time: 5,
  supplier_id: 'sup1',
  tool_type: 'ELECTRODE', tool_diameter: undefined, tool_length: undefined,
  max_usage_count: 50, regrind_max: 0,
  ... }

{ id: 'mat12', material_code: 'TL-INS-CNMG',
  name: 'CNMG 인서트 (선반용)',
  category: 'TOOL',
  specification: 'CNMG120408 VP15TF',
  unit: 'EA', unit_price: 8500,
  safety_stock: 30, lead_time: 3,
  supplier_id: 'sup2',
  tool_type: 'INSERT', tool_diameter: undefined, tool_length: undefined,
  max_usage_count: 100, regrind_max: 0,
  ... }

// ── 소모품 신규 추가 ──
{ id: 'mat13', material_code: 'CON-OIL-001',
  name: '수용성 절삭유',
  category: 'CONSUMABLE',
  specification: '20L 드럼',
  unit: 'L', unit_price: 5500,
  safety_stock: 40, lead_time: 2,
  supplier_id: 'sup2',
  min_order_qty: 20,
  ... }

{ id: 'mat14', material_code: 'CON-FIL-001',
  name: '오일미스트 필터',
  category: 'CONSUMABLE',
  specification: '300×300×50mm HEPA',
  unit: 'EA', unit_price: 35000,
  safety_stock: 5, lead_time: 5,
  supplier_id: 'sup2',
  min_order_qty: 5,
  ... }

// ── 강재 태그 Mock 데이터 ──
export const initialSteelTags: SteelTag[] = [
  {
    id: 'stag1', material_id: 'mat1', tag_no: 'NAK80-2601-001',
    weight: 328.5, status: 'IN_USE',
    project_id: 'proj1', location: 'MCT-1',
    received_at: '2026-01-15', issued_at: '2026-01-20',
    created_at: '2026-01-15', updated_at: '2026-01-20',
  },
  {
    id: 'stag2', material_id: 'mat1', tag_no: 'NAK80-2601-002',
    weight: 330.1, status: 'AVAILABLE',
    location: 'A-1-3',
    received_at: '2026-01-15',
    created_at: '2026-01-15', updated_at: '2026-01-15',
  },
  {
    id: 'stag3', material_id: 'mat2', tag_no: 'SKD11-2601-001',
    weight: 460.8, status: 'USED',
    project_id: 'proj2',
    received_at: '2026-01-10', issued_at: '2026-01-12',
    created_at: '2026-01-10', updated_at: '2026-01-18',
  },
  {
    id: 'stag4', material_id: 'mat2', tag_no: 'SKD11-2602-001',
    weight: 463.2, status: 'AVAILABLE',
    location: 'A-2-1',
    received_at: '2026-02-03',
    created_at: '2026-02-03', updated_at: '2026-02-03',
  },
  {
    id: 'stag5', material_id: 'mat3', tag_no: 'SKD61-2601-001',
    weight: 813.5, status: 'ALLOCATED',
    project_id: 'proj3', location: 'B-1-2',
    received_at: '2026-01-20',
    created_at: '2026-01-20', updated_at: '2026-02-01',
  },
];
```

---

## 4. UI/UX 변경 상세

### 4.1 자재 등록 — 카테고리별 조건부 폼 (`/materials/items/new`)

등록 폼은 **공통 영역** + **카테고리별 전용 영역**으로 구성한다.

#### 공통 영역 (모든 카테고리)

```
┌─────────────────────────────────────────────────┐
│ 자재코드 *      │ 자재명 *                       │
│ 분류 * [▼]      │ 단위 * [▼]                     │
│                                                  │
│ ╔══════════════════════════════════════════════╗  │
│ ║  ↓ 카테고리별 전용 섹션 (아래 참조)          ║  │
│ ╚══════════════════════════════════════════════╝  │
│                                                  │
│ 안전재고 [0]    │ 리드타임 [0] 일                │
│ 주 공급처 [▼]                                    │
│ 비고 [                                ]          │
└─────────────────────────────────────────────────┘
```

#### STEEL 전용 섹션 (이중 단위 + 중량 방식 반영)

```
╔═══ 강재 정보 ════════════════════════════════════╗
║ 강종 [NAK80 ▼]  밀도 [7.85] g/cm³ (자동입력)    ║
║ ────────────────────────────────────────────────  ║
║ 가로(W) [400] mm  세로(L) [300] mm               ║
║ 높이(H) [350] mm                                 ║
║ ────────────────────────────────────────────────  ║
║ 이론 중량: 329.70 kg/EA  (자동 계산)             ║
║ ────────────────────────────────────────────────  ║
║ 중량 방식: (●) 실측 (입고 시 칭량)               ║
║           ( ) 계산 (이론 중량 적용)               ║
║ ────────────────────────────────────────────────  ║
║ kg당 단가 [8,500] 원/kg                          ║
║ 1건당 참고 단가: 2,802,450 원 (자동)             ║
║ ────────────────────────────────────────────────  ║
║ ℹ️  구매: KG 단위 | 재고: 태그 EA 단위           ║
╚══════════════════════════════════════════════════╝
```

- 분류 `STEEL` 선택 시 표시
- **단위 자동 설정**: `unit = KG` (구매), `inventory_unit = EA` (재고)
- 강종 선택 → `STEEL_GRADE_DENSITY`에서 밀도 자동 입력 (수동 수정 가능)
- 치수 입력 → 이론 중량 실시간 계산
- **중량 방식 선택**: `실측`(입고 시 개별 칭량 필수) / `계산`(이론 중량 자동 적용)
- kg당 단가 입력 → `unit_price` 자동 계산 (1건당 참고가)
- 하단 안내: "구매 시 KG 단위로 발주, 입고 후 태그를 부여하여 EA로 관리"

#### TOOL 전용 섹션

```
╔═══ 공구 정보 ════════════════════════════════════╗
║ 공구 유형 [엔드밀 ▼]                             ║
║ ────────────────────────────────────────────────  ║
║ 직경 [10] mm    전장 [75] mm                     ║
║ ────────────────────────────────────────────────  ║
║ 최대 수명 [500] 회   최대 재연마 [3] 회          ║
║ ────────────────────────────────────────────────  ║
║ 규격 [Φ10 × 75L 4날]  (자유 텍스트, 보조 설명용) ║
║ 단가 [45,000] 원/EA                              ║
╚══════════════════════════════════════════════════╝
```

- 분류 `TOOL` 선택 시 표시, 단위 자동 `EA`
- 공구 유형 드롭다운
- 직경/전장은 해당 공구에만 입력 (전극 등은 빈칸 가능)
- 최대 수명/재연마 횟수 — 재고 관리·교체 시점 판단에 활용

#### CONSUMABLE 전용 섹션

```
╔═══ 소모품 정보 ══════════════════════════════════╗
║ 규격 [20L 드럼]  (자유 텍스트)                   ║
║ ────────────────────────────────────────────────  ║
║ 최소 발주 수량 [20]                              ║
║ 단가 [5,500] 원/단위                             ║
╚══════════════════════════════════════════════════╝
```

- 분류 `CONSUMABLE` 선택 시 표시
- 단위는 품목에 따라 `L`, `KG`, `EA`, `ROLL`, `M` 중 선택
- 최소 발주 수량 — 발주 등록 시 경고 연동

#### STANDARD_PART / PURCHASED 섹션

```
╔═══ 부품 정보 ════════════════════════════════════╗
║ 규격 [Φ3~Φ10 혼합 50pcs]  (자유 텍스트)         ║
║ 단가 [350,000] 원/단위                           ║
╚══════════════════════════════════════════════════╝
```

- 기존과 동일: 규격(specification)과 단가만 입력
- 단위는 `EA` 또는 `SET`

### 4.2 자재 상세 (`/materials/items/[id]`)

기본정보 섹션이 카테고리에 따라 다르게 표시된다:

| 카테고리 | 추가 표시 항목 |
|----------|--------------|
| STEEL | 강종, 밀도, 치수(W×L×H), 이론 중량, kg당 단가, 1건당 참고가, **중량 방식**, **태그 현황** |
| TOOL | 공구 유형, 직경, 전장, 최대 수명, 최대 재연마 |
| CONSUMABLE | 최소 발주 수량 |
| STANDARD_PART | 규격 |
| PURCHASED | 규격 |

**STEEL 자재 상세 — 태그 현황 섹션:**

```
┌─ 태그 현황 ──────────────────────────────────────────────────┐
│ 전체: 5 EA | 가용: 2 EA | 할당: 1 EA | 사용중: 1 EA | 완료: 1 │
│                                                               │
│ 태그 번호        │ 중량 │ 상태     │ 프로젝트    │ 위치   │
│ NAK80-2601-001  │ 328.5 kg │ 사용중   │ P-2026-001 │ MCT-1  │
│ NAK80-2601-002  │ 330.1 kg │ 가용     │ —          │ A-1-3  │
│ NAK80-2602-001  │ 329.8 kg │ 할당됨   │ P-2026-003 │ A-1-4  │
│ ...                                                           │
└───────────────────────────────────────────────────────────────┘
```

편집 모드에서도 동일한 조건부 필드 적용.

### 4.3 자재 목록 (`/materials/items`)

**테이블 컬럼 변경:**

| 컬럼 | STEEL | TOOL | CONSUMABLE | STANDARD_PART | PURCHASED |
|------|-------|------|-----------|---------------|-----------|
| 자재코드 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 자재명 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 분류 | 강재 | 공구 | 소모품 | 표준부품 | 구매품 |
| 규격/상세 | `400×300×350` | `Φ10 엔드밀` | `20L 드럼` | `Φ3~Φ10 50pcs` | `2-drop valve gate` |
| 단위 | `KG` (구매) / `EA` (재고) | EA | L/ROLL/EA | EA/SET | EA/SET |
| 단가 | `8,500원/kg` | `45,000원` | `5,500원` | `350,000원` | `8,500,000원` |
| 재고 | `2 EA (658.6 kg)` | `15 EA` | `40 L` | `8 SET` | `1 SET` |

- **규격/상세** 컬럼: 카테고리에 따라 가장 유용한 정보를 자동 선택하여 표시
  - STEEL: `{W}×{L}×{H}` (치수)
  - TOOL: `Φ{직경} {유형라벨}` (없으면 specification)
  - 나머지: specification 그대로
- **단위** 컬럼: STEEL은 `KG/EA` 이중 표시
- **단가** 컬럼: STEEL은 `원/kg` 표시 (1건당 참고가는 상세에서)
- **재고** 컬럼: STEEL은 `{가용 EA수} EA ({총 중량}kg)` 형태로 태그 기반 집계

### 4.4 카테고리 필터 추가

자재 목록 상단에 카테고리 필터 탭 추가:

```
[전체] [강재] [공구] [소모품] [표준부품] [구매품]
```

### 4.5 발주 등록 — STEEL KG 기반 (`/materials/purchase-orders/new`)

**STEEL 자재 발주 시 UI:**

```
┌─ 발주 품목 추가 ─────────────────────────────────────────────┐
│ 자재: [NAK80 (400×300×350mm) ▼]                              │
│                                                               │
│ ┌─ 강재 발주 정보 ─────────────────────────────────────────┐  │
│ │ 이론 중량: 329.70 kg/EA                                  │  │
│ │ kg당 단가: 8,500 원/kg                                   │  │
│ │ ──────────────────────────────────────────────────────── │  │
│ │ 발주 수량: [3] EA  →  총 중량: 989.10 kg                 │  │
│ │ 발주 금액: 8,407,350 원                                  │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                               │
│ [+ 추가]                                                      │
└───────────────────────────────────────────────────────────────┘
```

- EA 수량 입력 → 총 중량(KG) 자동 계산
- 금액 = 총 중량 × kg당 단가
- PO item에 `quantity` = EA 수량, `unit_price` = 건당 단가 (참고), 별도 `total_weight_kg` 필드 저장

### 4.6 입고 처리 — 태그 부여 (`/materials/receiving`)

**STEEL 자재 입고 시 UI — 중량 방식에 따라 분기:**

**A. 실측 방식 (weight_method = MEASURED):**

```
┌─ STEEL 입고 처리 (실측) ──────────────────────────────────────┐
│ 발주: PO-2026-001 | NAK80 (400×300×350mm) | 3 EA             │
│ 중량 방식: 실측 (입고 시 칭량)                                 │
│ ──────────────────────────────────────────────────────────     │
│                                                                │
│ 입고 수량: [3] EA                                              │
│                                                                │
│ ┌─ 태그 등록 ──────────────────────────────────────────────┐   │
│ │ # │ 태그 번호 (자동)     │ 중량(kg) *    │ 보관 위치      │   │
│ │ 1 │ [NAK80-2602-001]    │ [328.5]      │ [A-1-3]        │   │
│ │ 2 │ [NAK80-2602-002]    │ [330.1]      │ [A-1-4]        │   │
│ │ 3 │ [NAK80-2602-003]    │ [329.8]      │ [A-2-1]        │   │
│ │───────────────────────────────────────────────────────── │   │
│ │ 총 실측: 988.4 kg  (이론: 989.1 kg, 차이: -0.7 kg)       │   │
│ └──────────────────────────────────────────────────────────┘   │
│ [입고 완료]                                                     │
└────────────────────────────────────────────────────────────────┘
```

- 중량 입력란: **빈칸** → 사용자가 실측값 직접 입력 (필수)
- 이론 중량 대비 차이 표시

**B. 계산 방식 (weight_method = CALCULATED):**

```
┌─ STEEL 입고 처리 (계산값) ────────────────────────────────────┐
│ 발주: PO-2026-002 | S45C (300×200×150mm) | 5 EA              │
│ 중량 방식: 계산 (이론 중량 적용)                               │
│ ──────────────────────────────────────────────────────────     │
│                                                                │
│ 입고 수량: [5] EA                                              │
│                                                                │
│ ┌─ 태그 등록 ──────────────────────────────────────────────┐   │
│ │ # │ 태그 번호 (자동)     │ 중량(kg)      │ 보관 위치      │   │
│ │ 1 │ [S45C-2602-001]     │ 70.65 (자동)  │ [A-1-3]        │   │
│ │ 2 │ [S45C-2602-002]     │ 70.65 (자동)  │ [A-1-4]        │   │
│ │ 3 │ [S45C-2602-003]     │ 70.65 (자동)  │ [A-2-1]        │   │
│ │ 4 │ [S45C-2602-004]     │ 70.65 (자동)  │ [      ]       │   │
│ │ 5 │ [S45C-2602-005]     │ 70.65 (자동)  │ [      ]       │   │
│ │───────────────────────────────────────────────────────── │   │
│ │ 총 중량: 353.25 kg (이론값 자동 적용)                      │   │
│ └──────────────────────────────────────────────────────────┘   │
│ [입고 완료]                                                     │
└────────────────────────────────────────────────────────────────┘
```

- 중량 입력란: **이론 중량 자동 적용** (수정 가능하나 기본값 사용)
- 빠른 입고 처리 가능

**공통:**
- 입고 수량(EA) 입력 → 해당 수만큼 태그 행 자동 생성
- 태그 번호: `{강종}-{YYMM}-{시퀀스}` 자동 생성 (수동 수정 가능)
- 보관 위치 입력 (선택)
- 입고 완료 시: `steel_tags` 레코드 생성 + `stock_movements` IN 레코드 + `stocks` 수량 갱신

### 4.7 재고 현황 — STEEL 태그 뷰 (`/materials/inventory`)

기존 재고 현황에 **STEEL 태그 상세 뷰** 추가:

```
┌─ 재고 현황 ──────────────────────────────────────────────────┐
│ [전체] [강재 태그] [공구] [소모품] [표준부품] [구매품]         │
│                                                               │
│ ── 강재 태그 탭 ──                                            │
│                                                               │
│ 필터: [강종 ▼] [상태 ▼] [프로젝트 ▼]                         │
│                                                               │
│ 태그 번호      │ 강종  │ 치수         │ 중량     │ 상태   │ 프로젝트    │ 위치  │
│ NAK80-2601-002│ NAK80│ 400×300×350 │ 330.1 kg│ 가용   │ —          │ A-1-3│
│ SKD11-2602-001│ SKD11│ 500×400×300 │ 463.2 kg│ 가용   │ —          │ A-2-1│
│ SKD61-2601-001│ SKD61│ 600×500×350 │ 813.5 kg│ 할당됨 │ P-2026-003│ B-1-2│
│ NAK80-2601-001│ NAK80│ 400×300×350 │ 328.5 kg│ 사용중 │ P-2026-001│ MCT-1│
│                                                               │
│ KPI: 가용 2 EA (793.3 kg) | 할당 1 EA (813.5 kg) | 사용중 1 EA│
└───────────────────────────────────────────────────────────────┘
```

- 태그 단위로 개별 강재 추적
- 상태·프로젝트·위치 인라인 수정 가능
- 프로젝트 할당: 가용 태그 선택 → 프로젝트 드롭다운 → `ALLOCATED` 상태 전환

### 4.8 발주/입고/재고 연동 매트릭스

| 영역 | STEEL | TOOL | CONSUMABLE | STANDARD_PART / PURCHASED |
|------|-------|------|-----------|--------------------------|
| **발주 등록** | EA 수량 입력 → KG 환산, kg당 단가 기반 금액 | 수명 참고 표시 | 최소발주량 검증 | 변경 없음 |
| **입고 등록** | **태그 부여**, 중량: 실측 입력 or 계산값 자동 적용 | 기본 입고 | 기본 입고 | 기본 입고 |
| **재고 현황** | **태그 EA 목록** + 총 중량 합산 | 재고수량 | 재고수량 | 재고수량 |
| **출고** | **태그 지정** → 프로젝트 할당 | 수량 출고 | 수량 출고 | 수량 출고 |

---

## 5. 영향 범위 분석

### 5.1 수정 대상 파일

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `types/index.ts` | **수정** | MaterialCategory에 TOOL 추가, ToolType/SteelWeightMethod/SteelTag 타입, Material에 inventory_unit·weight_method 등 필드 추가 |
| `lib/utils.ts` | **수정** | `calcSteelWeight()`, `calcSteelPrice()`, `generateSteelTagNo()`, `calcTotalWeight()`, `calcSteelOrderAmount()` 추가 |
| `lib/mock-data.ts` | **수정** | STEEL 3건에 이중 단위 필드, TOOL 4건 + CONSUMABLE 2건 신규, SteelTag 5건 신규 |
| `lib/store.ts` | **수정** | STEEL 중량 자동 계산, steelTags 상태 관리 (CRUD + 상태 전환), mock 데이터 확장 반영 |
| `lib/supabase/materials.ts` | **수정** | `fetchSteelTags()`, `insertSteelTag()`, `updateSteelTagDB()` 추가 |
| `app/materials/items/new/page.tsx` | **수정** | 카테고리별 조건부 폼 (STEEL 이중 단위 안내 포함) |
| `app/materials/items/[id]/page.tsx` | **수정** | 상세에 STEEL 태그 현황 섹션 추가 |
| `app/materials/items/page.tsx` | **수정** | 카테고리 필터 탭, STEEL 이중 단위 표시, 태그 기반 재고 집계 |
| `app/materials/purchase-orders/new/page.tsx` | **수정** | STEEL: EA입력→KG환산→금액 계산 UI |
| `app/materials/receiving/page.tsx` | **수정** | STEEL 입고 시 태그 등록 UI 연동 |
| `app/materials/receiving/new/page.tsx` | **수정** | STEEL 입고: 태그 부여, 중량 방식별 분기 (실측 입력 / 계산값 자동) |
| `app/materials/inventory/page.tsx` | **수정** | STEEL 태그 뷰 탭 추가, 태그 상태 관리 |
| `app/materials/statistics/page.tsx` | **수정** | 분류별 차트에 TOOL 포함 |
| Supabase `materials` 테이블 | **마이그레이션** | CHECK 수정 + inventory_unit + 14개 컬럼 추가 |
| Supabase `steel_tags` 테이블 | **마이그레이션 (신규)** | 강재 개별 태그 추적 테이블 |

### 5.2 변경하지 않는 파일

- `components/common/*` — 공통 컴포넌트 변경 불필요
- `components/layout/sidebar.tsx` — 메뉴 변경 없음
- `app/materials/suppliers/*` — 거래처는 영향 없음

---

## 6. 구현 단계

### Phase 1: 데이터 모델 + 기반 (모든 카테고리)

| Task | 파일 | 설명 | 우선순위 |
|------|------|------|---------|
| P1-1 | `types/index.ts` | MaterialCategory에 TOOL 추가, ToolType/SteelWeightMethod/SteelTagStatus/SteelTag 타입, STEEL_GRADE_DENSITY, Material에 inventory_unit·weight_method 등 필드 | HIGH |
| P1-2 | `lib/utils.ts` | `calcSteelWeight()`, `calcSteelPrice()`, `generateSteelTagNo()`, `calcTotalWeight()`, `calcSteelOrderAmount()` | HIGH |
| P1-3 | `lib/mock-data.ts` | STEEL 3건 이중 단위 + TOOL 4건 + CONSUMABLE 2건 + SteelTag 5건 | HIGH |
| P1-4 | Supabase 마이그레이션 | materials CHECK·컬럼 + steel_tags 테이블 신규 | HIGH |
| P1-5 | `lib/store.ts` | STEEL 중량 자동 계산, steelTags CRUD + 상태 전환 (allocate/issue/complete/scrap) | HIGH |
| P1-6 | `lib/supabase/materials.ts` | `fetchSteelTags()`, `insertSteelTag()`, `updateSteelTagDB()`, `deleteSteelTagDB()` | HIGH |

**검증**: `npx next build` 성공, Supabase 데이터 확인

### Phase 2: 자재 등록/상세/목록 UI (핵심)

| Task | 파일 | 설명 | 우선순위 |
|------|------|------|---------|
| P2-1 | `app/materials/items/new/page.tsx` | 카테고리별 조건부 폼 (STEEL 이중 단위+중량 방식, TOOL 유형·직경·수명, CONSUMABLE 최소발주량) | HIGH |
| P2-2 | `app/materials/items/[id]/page.tsx` | 상세 카테고리별 정보 + STEEL 태그 현황 섹션 | HIGH |
| P2-3 | `app/materials/items/page.tsx` | 카테고리 필터 탭 + STEEL 이중 단위 표시 + 태그 기반 재고 집계 | MEDIUM |

**검증**: `npx next build` 성공, 5개 카테고리 등록/편집/조회 동작

### Phase 3: 발주/입고 — STEEL 이중 단위 연동

| Task | 파일 | 설명 | 우선순위 |
|------|------|------|---------|
| P3-1 | `app/materials/purchase-orders/new/page.tsx` | STEEL: EA→KG 환산, kg당 단가 기반 금액. CONSUMABLE 최소발주량 경고 | HIGH |
| P3-2 | `app/materials/receiving/new/page.tsx` | STEEL 입고: 태그 자동 생성, 중량 방식 분기 (실측/계산), 보관 위치 | HIGH |
| P3-3 | `app/materials/receiving/page.tsx` | 미입고 현황에서 STEEL 태그 미부여 표시 | MEDIUM |

**검증**: STEEL 발주→입고→태그 생성 워크플로우 정상 동작

### Phase 4: 재고 — 태그 관리 + 프로젝트 할당

| Task | 파일 | 설명 | 우선순위 |
|------|------|------|---------|
| P4-1 | `app/materials/inventory/page.tsx` | STEEL 태그 뷰 탭, 태그별 상세 표시, 상태 필터 | HIGH |
| P4-2 | `app/materials/inventory/page.tsx` | 태그→프로젝트 할당 (ALLOCATED), 출고 (IN_USE), 완료/폐기 | MEDIUM |
| P4-3 | `app/materials/statistics/page.tsx` | 분류별 차트에 TOOL 포함, STEEL 중량 기반 통계 | LOW |

**검증**: `npx next build` 성공, 전체 시나리오 테스트

---

## 7. 설계 원칙

### 7.1 하위 호환성

- 모든 신규 필드는 **optional** (`?`)
- 기존 STANDARD_PART/PURCHASED 자재는 신규 필드 미사용 — **영향 없음**
- 기존 Supabase CRUD 함수(`lib/supabase/materials.ts`)는 **최소 변경** (steel_tags 관련만 추가)
- `unit_price`는 **모든 카테고리에서 유지** — STEEL은 1건당 참고가 (weight × price_per_kg)

### 7.2 단위 정책 (이중 단위)

| 카테고리 | 구매 단위 | 재고 단위 | 단가 기준 | 중량 방식 | 비고 |
|----------|----------|----------|----------|----------|------|
| **STEEL** | **KG** (자동) | **EA** (태그) | **원/kg** | **실측 / 계산 선택** | 발주: KG 기준 정산. 재고: 태그 EA. 중량 방식은 자재 마스터에서 설정 |
| TOOL | EA (자동) | EA | 원/EA | — | 구매=재고 동일 단위 |
| CONSUMABLE | (사용자 선택) | (구매 단위와 동일) | 원/단위 | — | 품목별 상이 |
| STANDARD_PART | (사용자 선택) | (구매 단위와 동일) | 원/EA or 원/SET | — | — |
| PURCHASED | (사용자 선택) | (구매 단위와 동일) | 원/EA or 원/SET | — | — |

**STEEL 이중 단위 상세:**

```
발주서: 3 EA × 329.70 kg/EA = 989.10 KG × 8,500 원/kg = 8,407,350원
         ↑ 수량(EA)            ↑ 정산 기준(KG)         ↑ 발주 금액

재고:   NAK80-2602-001 (328.5kg) AVAILABLE  @ A-1-3
        NAK80-2602-002 (330.1kg) ALLOCATED  → P-2026-003
        NAK80-2602-003 (329.8kg) IN_USE     → P-2026-005
        ↑ 태그(EA) 단위 개별 추적
```

### 7.3 카테고리 선택 시 동작

| 액션 | STEEL | TOOL | CONSUMABLE | STANDARD_PART | PURCHASED |
|------|-------|------|-----------|---------------|-----------|
| 구매 단위 자동 설정 | `KG` | `EA` | 유지 | 유지 | 유지 |
| 재고 단위 자동 설정 | `EA` (태그) | — | — | — | — |
| 전용 섹션 표시 | 강재 정보 + 이중 단위 + 중량 방식 | 공구 정보 | 소모품 정보 | 기본(규격+단가) | 기본(규격+단가) |
| 규격 필드 | 자동 생성 (`WxLxH`) | 자유 텍스트 (보조) | 자유 텍스트 | 자유 텍스트 | 자유 텍스트 |
| unit_price 입력 | 자동 (kg단가 × 이론중량) — 참고용 | 직접 입력 | 직접 입력 | 직접 입력 | 직접 입력 |

### 7.4 확장 포인트

향후 고려사항 (이번 구현 범위 밖):

| 항목 | 설명 | 시기 |
|------|------|------|
| **공구 사용 이력** | 프로젝트/공정별 공구 투입 기록, 누적 사용 횟수 추적 | Phase 2+ |
| **재연마 관리** | 공구 재연마 이력, 재연마 후 수명 재설정 | Phase 2+ |
| **태그 라벨 인쇄** | 태그 번호 QR/바코드 라벨 출력 연동 | Phase 2+ |
| **소비율 추적** | 소모품 월별 소비량 트렌드, 자동 발주 제안 | Phase 2+ |
| **공구 수명 경고** | 사용 횟수가 max_usage_count에 근접 시 교체 알림 | Phase 2+ |
| **LOT 관리** | 소모품/강재의 로트 번호 추적 | Phase 2+ |
| **강종 마스터 테이블** | 강종 정보를 별도 DB 테이블로 관리 (현재는 상수) | Phase 2+ |
| **입고 칭량 연동** | 저울 장비 연동으로 MEASURED 방식 자재의 중량 자동 입력 | Phase 3+ |
| **태그 상태 이력** | 태그별 상태 변경 히스토리 (audit trail) | Phase 3+ |
| **프로젝트별 소요 자재** | BOM 연동: 프로젝트별 필요 강재 목록 → 태그 자동 할당 제안 | Phase 3+ |

---

## 8. 테스트 시나리오

### 8.1 STEEL 자재 등록

1. 분류 `STEEL` 선택 → 강종/치수 입력 섹션 표시, 구매 단위 자동 `KG`, 재고 단위 자동 `EA`
2. 강종 `NAK80` 선택 → 밀도 `7.85` 자동 입력
3. 치수 `400 × 300 × 350` 입력 → 이론 중량 `329.70 kg/EA` 실시간 표시
4. **중량 방식** `실측` 선택 (기본값)
5. kg당 단가 `8,500` 입력 → 1건당 참고 단가 `2,802,450원` 자동 계산
6. 저장 → store + Supabase에 모든 필드 저장 확인 (inventory_unit = 'EA', weight_method = 'MEASURED' 포함)
7. 이중 단위 안내 문구 표시 확인: "구매: KG | 재고: 태그 EA"

### 8.2 STEEL 발주 (KG 기반)

1. 발주 등록에서 STEEL 자재 (NAK80 400×300×350) 선택
2. 수량 `3 EA` 입력 → 총 중량 `989.10 kg` 자동 표시
3. 발주 금액 `8,407,350원` (= 989.10 × 8,500) 자동 계산
4. 발주서 저장 → KG 기반 금액 정상 반영

### 8.3 STEEL 입고 + 태그 부여 (실측 방식)

1. PO-2026-001 (NAK80 3EA, weight_method: MEASURED) 입고 처리 시작
2. 입고 수량 `3 EA` 입력 → 태그 행 3개 자동 생성
3. 태그 번호 자동 생성 확인: `NAK80-2602-001`, `NAK80-2602-002`, `NAK80-2602-003`
4. 중량 입력란: **빈칸** 상태 → 각 태그별 중량 수기 입력: `328.5`, `330.1`, `329.8`
5. 총 중량 `988.4 kg` 표시, 이론 대비 차이 `-0.7 kg` 표시
6. 보관 위치 입력: `A-1-3`, `A-1-4`, `A-2-1`
7. 입고 완료 → `steel_tags` 3건 생성 (status: AVAILABLE), `stock_movements` IN 레코드 생성

### 8.3b STEEL 입고 + 태그 부여 (계산 방식)

1. PO-2026-002 (S45C 5EA, weight_method: CALCULATED) 입고 처리 시작
2. 입고 수량 `5 EA` 입력 → 태그 행 5개 자동 생성
3. 중량 입력란: **이론 중량 70.65 kg 자동 적용** (각 태그 동일)
4. 사용자는 중량 수정 없이 보관 위치만 입력
5. 입고 완료 → `steel_tags` 5건 생성 (각 70.65 kg), 빠르게 처리 완료

### 8.4 STEEL 태그 재고 관리

1. 재고 현황에서 "강재 태그" 탭 선택
2. 가용 태그 목록 표시 확인 (status = AVAILABLE)
3. 태그 `NAK80-2602-001` 선택 → 프로젝트 `P-2026-003` 할당 → 상태 `ALLOCATED`로 변경
4. 할당된 태그 출고 → 상태 `IN_USE`로 변경, `issued_at` 기록
5. 가공 완료 → 상태 `USED`로 변경
6. KPI 카드: 가용/할당/사용중/완료 집계 정상

### 8.5 TOOL 공구

1. 분류 `TOOL` 선택 → 공구 정보 섹션 표시, 단위 자동 `EA`
2. 공구 유형 `END_MILL`, 직경 `10mm`, 전장 `75mm`
3. 최대 수명 `500`, 최대 재연마 `3`
4. 단가 `45,000원` 직접 입력
5. 저장 → 목록에서 `Φ10 엔드밀` 형태로 표시 확인

### 8.6 CONSUMABLE 소모품

1. 분류 `CONSUMABLE` 선택 → 소모품 정보 섹션 표시
2. 단위 `L` 선택, 최소 발주 수량 `20`
3. 단가 `5,500원/L` 입력
4. 저장 → 발주 등록 시 수량 20 미만이면 경고

### 8.7 STANDARD_PART / PURCHASED

1. 기존과 동일하게 규격/단가 입력
2. 기존 자재 상세 페이지가 정상 동작 확인

### 8.8 카테고리 전환

1. 자재 등록에서 분류를 `STEEL` → `TOOL` → `CONSUMABLE` → `STANDARD_PART`로 변경
2. 각 전환 시 해당 전용 섹션만 표시, 다른 섹션 숨김
3. STEEL→TOOL 전환 시 강재 필드 초기화, 공구 필드 표시
4. STEEL 선택 시 이중 단위 안내 표시, TOOL 선택 시 사라짐

### 8.9 자재 목록 필터

1. 카테고리 탭 `전체` → 모든 자재 표시
2. `공구` 탭 → TOOL 카테고리만 필터
3. `강재` 탭 → STEEL 카테고리만 필터, KG/EA 이중 단위·태그 기반 재고 표시

### 8.10 STEEL 전체 워크플로우 — 실측 (E2E)

1. 자재 등록: NAK80 300×200×250mm, 밀도 7.85, kg당 단가 9,000원, **중량 방식: 실측**
2. 발주 등록: 2 EA → 총 117.75 kg → 금액 1,059,750원
3. 입고: 2 EA 입고, 태그 2건 생성, **중량 수기 입력**
4. 재고 확인: 강재 태그 탭에서 2건 AVAILABLE
5. 프로젝트 할당: 1건 ALLOCATED
6. 출고: 1건 IN_USE
7. 완료: 1건 USED
8. 재고 확인: 1건 AVAILABLE, 1건 USED

### 8.11 STEEL 전체 워크플로우 — 계산 (E2E)

1. 자재 등록: S45C 300×200×150mm, 밀도 7.85, kg당 단가 4,000원, **중량 방식: 계산**
2. 발주 등록: 5 EA → 총 353.25 kg → 금액 1,413,000원
3. 입고: 5 EA 입고, 태그 5건 생성, **이론 중량 70.65 kg 자동 적용** (수기 입력 불필요)
4. 재고 확인: 강재 태그 탭에서 5건 AVAILABLE (각 70.65 kg)
5. 프로젝트 할당/출고/완료: 실측 방식과 동일하게 동작

---

## 9. 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2026-02-09 | v1.0 | 초기 계획 — STEEL 체적중량 관리만 |
| 2026-02-09 | v1.1 | 확장 — TOOL(공구) 카테고리 추가, CONSUMABLE 속성 확장, 5개 카테고리별 조건부 UI 설계 |
| 2026-02-09 | v1.2 | **STEEL 이중 단위 모델** — 구매 KG / 재고 태그 EA 이중 단위 관리, `steel_tags` 테이블 신규, 태그 기반 입고·재고·출고 워크플로우, 발주 KG 환산 UI, HMLV 특성 반영 |
| 2026-02-09 | v1.3 | **STEEL 중량 방식 선택** — `weight_method`: 실측(MEASURED) / 계산(CALCULATED) 분기. 실측: 입고 시 칭량 필수, 계산: 이론 중량 자동 적용. **TOOL 공구 재질 제거** — `tool_material`/`ToolMaterial` 타입 삭제, 공구는 유형·직경·전장·수명만 관리 |
