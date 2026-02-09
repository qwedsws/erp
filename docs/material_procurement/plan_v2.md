# 금속 원자재 치수 분리 및 태그 확장 계획

> **문서 버전**: v2.1
> **작성일**: 2026-02-10
> **기준 문서**: plan_v1.md (v1.3), PRD.md 섹션 3.5, 7.4
> **상위 문서**: [m_p_plan.md](./m_p_plan.md) — 자재 구매 관리 세부 구현 계획

---

## 1. 문제 정의

### 1.1 현재 구조의 한계

현재 시스템에서 STEEL 자재의 **치수(W x L x H)는 Material 마스터에 고정**되어 있다:

```
Material (id: mat1)
  ├── name: "NAK80"
  ├── dimension_w: 400      ← 마스터에 고정
  ├── dimension_l: 300      ← 마스터에 고정
  ├── dimension_h: 350      ← 마스터에 고정
  ├── weight: 329.70 kg     ← 치수로부터 계산된 고정값
  └── price_per_kg: 8,500
```

이 구조에서 **같은 강종(AL6061)을 다른 치수로 발주**하려면:

```
(현재) 품목 등록을 치수마다 따로 해야 함:
  Material A: AL6061 (400×300×350)  ← 프로젝트 A용
  Material B: AL6061 (500×200×150)  ← 프로젝트 B용
  Material C: AL6061 (300×300×200)  ← 프로젝트 C용
  ...
```

### 1.2 HMLV 현장 실제

금형 제조업(HMLV)의 금속 원자재 구매 패턴:

1. **동일 강종, 다양한 치수**: 하나의 프로젝트에서도 부품별로 AL6061을 여러 치수로 발주
2. **프로젝트별 전용 가공**: 각 블록은 특정 금형 부품 전용이므로 재사용성이 극히 낮음
3. **공급처 정산은 KG 기준**: 강종별 kg당 단가로 정산, 치수는 발주 명세에만 기재
4. **현장 관리는 태그 EA**: 입고된 개별 블록에 태그를 붙여 추적

따라서 **Material 마스터 = 강종(Grade) 마스터**로 기능해야 하고, **치수는 발주/태그 레벨에서 관리**해야 한다.

### 1.3 목표

- Material 마스터에서 **치수(W/L/H)와 고정 중량을 제거** → 강종 + 밀도 + kg단가만 관리
- **PurchaseRequest / PurchaseOrderItem에 치수 추가** → 발주 시 치수 지정
- **SteelTag에 치수 추가** → 태그별 실제 치수 + 중량 추적
- 기존 STEEL 태그 워크플로우(입고 → 태그 부여 → 프로젝트 할당 → 출고)는 그대로 유지

### 1.4 STEEL 카테고리와 금속 원자재 범위

현재 시스템의 `MaterialCategory = 'STEEL'`은 **"강재"**라는 명칭이지만, 실제 금형 제조 현장에서는 **모든 금속 블록 원자재**를 포괄한다:

| 계열 | 대표 강종 | 밀도 (g/cm3) | 용도 |
|------|----------|-------------|------|
| **금형강 (철계)** | NAK80, SKD11, SKD61, S45C, P20 | 7.70 ~ 7.93 | 사출/프레스/다이캐스팅 금형 본체 |
| **알루미늄 합금** | AL6061, AL7075, AL5052 | 2.71 ~ 2.81 | 시작금형, 경량 치구, 전극 홀더 |
| **동합금** | C1100(순동), C2801(황동) | 8.50 ~ 8.94 | 방전 전극 소재, 냉각 부품 |
| **스테인리스** | SUS304, SUS420J2 | 7.75 ~ 7.93 | 내식성 금형 부품 |

**"강종 마스터"는 곧 "금속 블록 원자재 마스터"**이다. 카테고리 이름은 `STEEL`을 유지하되(하위 호환), 향후 `METAL` 또는 `BLOCK`으로 리네이밍을 고려한다.

이 계획에서 AL6061을 대표 예시로 사용하는 이유:
- HMLV 금형 제조에서 **알루미늄은 시작금형/치구에 높은 비중**
- 동일 강종(AL6061)을 프로젝트별로 **다양한 치수로 발주**하는 패턴이 가장 빈번
- 알루미늄은 철계보다 밀도가 낮아 **치수별 중량 차이가 원가에 직결**

---

## 2. 데이터 모델 변경

### 2.1 Material 엔티티 변경

**제거 대상** (Material에서 → PurchaseOrderItem/SteelTag로 이동):

| 필드 | 현재 위치 | 이동 대상 | 사유 |
|------|----------|----------|------|
| `dimension_w` | Material | PurchaseOrderItem, PurchaseRequest, SteelTag | 발주/태그마다 다름 |
| `dimension_l` | Material | PurchaseOrderItem, PurchaseRequest, SteelTag | 발주/태그마다 다름 |
| `dimension_h` | Material | PurchaseOrderItem, PurchaseRequest, SteelTag | 발주/태그마다 다름 |
| `weight` | Material | (계산값, 제거) | 치수가 없으면 의미 없음 |

**유지 대상** (Material에 그대로):

| 필드 | 사유 |
|------|------|
| `steel_grade` | 강종은 마스터 속성 |
| `density` | 밀도는 강종별 고정값 |
| `price_per_kg` | kg당 단가는 마스터 수준에서 관리 |
| `weight_method` | MEASURED/CALCULATED 정책은 강종별로 결정 |

**변경 후 Material (STEEL)**:

```typescript
// Material — STEEL 카테고리 예시
{
  id: 'mat-al6061',
  material_code: 'ST-AL6061',
  name: 'AL6061',
  category: 'STEEL',
  unit: 'KG',
  inventory_unit: 'EA',
  steel_grade: 'AL6061',
  density: 2.71,              // g/cm3
  price_per_kg: 12000,        // 원/kg
  weight_method: 'MEASURED',  // 입고 시 칭량
  // dimension_w: (제거)
  // dimension_l: (제거)
  // dimension_h: (제거)
  // weight: (제거)
}
```

### 2.2 PurchaseOrderItem 확장

발주 품목에 치수를 추가하여 "AL6061 400x300x350, 3EA"를 한 줄로 표현:

```typescript
export interface PurchaseOrderItem {
  id: string;
  material_id: string;
  quantity: number;
  unit_price: number;
  received_quantity?: number;

  // ── v2 추가: STEEL 치수 (발주 시 지정) ──
  dimension_w?: number;       // 가로 (mm)
  dimension_l?: number;       // 세로 (mm)
  dimension_h?: number;       // 높이 (mm)
  piece_weight?: number;      // 건당 이론 중량 (kg) — density × W × L × H / 1e6
  total_weight?: number;      // 총 중량 (kg) — piece_weight × quantity
}
```

**발주서 예시** (하나의 PO에 같은 AL6061, 다른 치수):

```
PO-2026-005 | 공급처: 대한특수강
─────────────────────────────────────────────────────────────
#  자재         치수(mm)        수량  건당중량   총중량     금액
1  AL6061    400×300×350     3 EA  113.82kg  341.46kg  4,097,520원
2  AL6061    500×200×150     2 EA   40.65kg   81.30kg    975,600원
3  AL6061    300×300×200     1 EA   48.78kg   48.78kg    585,360원
─────────────────────────────────────────────────────────────
합계                          6 EA           471.54kg  5,658,480원
```

### 2.3 PurchaseRequest 확장

구매 요청에도 치수 추가:

```typescript
export interface PurchaseRequest {
  id: string;
  pr_no: string;
  material_id: string;
  quantity: number;
  required_date: string;
  reason: string;
  requested_by: string;
  status: PurchaseRequestStatus;
  // ... 기존 필드

  // ── v2 추가: STEEL 치수 ──
  dimension_w?: number;
  dimension_l?: number;
  dimension_h?: number;
  piece_weight?: number;
}
```

### 2.4 SteelTag 확장

태그에 치수 추가 (기존 weight는 유지):

```typescript
export interface SteelTag {
  id: string;
  material_id: string;
  tag_no: string;
  weight: number;             // 실제 중량 (kg) — 실측 or 계산
  status: SteelTagStatus;
  project_id?: string;
  purchase_order_id?: string;
  po_item_id?: string;        // v2: 어떤 발주 품목에서 입고되었는지
  location?: string;
  received_at: string;
  issued_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;

  // ── v2 추가: 개별 태그의 치수 ──
  dimension_w?: number;       // 가로 (mm)
  dimension_l?: number;       // 세로 (mm)
  dimension_h?: number;       // 높이 (mm)
}
```

### 2.5 변경 전/후 비교

```
[v1 — 현재]
Material (AL6061 400×300×350)    ← 치수 고정, 다른 치수면 별도 등록
  └── SteelTag (weight만)

[v2 — 변경 후]
Material (AL6061)                ← 강종 마스터 (치수 없음)
  ├── PO Item: AL6061 400×300×350, 3EA   ← 발주 시 치수 지정
  ├── PO Item: AL6061 500×200×150, 2EA
  ├── PR:      AL6061 300×300×200, 1EA   ← 구매 요청 시 치수 지정
  │
  ├── SteelTag: AL6061-2602-001 (400×300×350, 113.5kg)  ← 태그에 치수
  ├── SteelTag: AL6061-2602-002 (400×300×350, 114.1kg)
  ├── SteelTag: AL6061-2602-003 (400×300×350, 113.8kg)
  ├── SteelTag: AL6061-2602-004 (500×200×150, 40.3kg)
  └── SteelTag: AL6061-2602-005 (500×200×150, 41.0kg)
```

---

## 3. 워크플로우 변경

### 3.1 자재 등록 (변경)

**현재**: AL6061 등록 시 치수(400×300×350) 입력 필수 → 다른 치수는 별도 품목
**변경 후**: AL6061 등록 시 **강종 + 밀도 + kg단가만 입력** → 치수는 발주/구매요청에서 지정

```
┌─ 자재 등록 (STEEL) ────────────────────────────────┐
│ 자재코드: [ST-AL6061]                                │
│ 자재명:   [AL6061]                                   │
│ 분류:     [강재 (STEEL)]                             │
│                                                      │
│ ╔═══ 강재 정보 ═══════════════════════════════════╗  │
│ ║ 강종:     [AL6061]   밀도: [2.71] g/cm3         ║  │
│ ║ kg당 단가: [12,000] 원/kg                       ║  │
│ ║ 중량 방식: (o) 실측  ( ) 계산                   ║  │
│ ║                                                  ║  │
│ ║ * 치수(W×L×H)는 발주/구매요청 시 지정합니다     ║  │
│ ╚══════════════════════════════════════════════════╝  │
│                                                      │
│ 안전재고: [5] EA   리드타임: [7] 일                  │
│ 주 공급처: [대한특수강 ▼]                            │
└──────────────────────────────────────────────────────┘
```

### 3.2 구매 요청 (변경)

STEEL 자재 구매 요청 시 **치수를 입력**:

```
┌─ 구매 요청 등록 ─────────────────────────────────────┐
│ 자재: [AL6061 ▼]                                      │
│                                                        │
│ ╔═══ 치수 지정 ═══════════════════════════════════╗   │
│ ║ 가로(W): [400] mm                               ║   │
│ ║ 세로(L): [300] mm                               ║   │
│ ║ 높이(H): [350] mm                               ║   │
│ ║ ─────────────────────────────────────────────── ║   │
│ ║ 건당 이론 중량: 113.82 kg  (자동 계산)          ║   │
│ ╚══════════════════════════════════════════════════╝   │
│                                                        │
│ 수량:    [3] EA                                        │
│ 총 중량: 341.46 kg  (자동 계산)                        │
│ 예상 금액: 4,097,520원                                 │
│ 필요일:  [2026-02-28]                                  │
│ 사유:    [P-2026-005 CORE INSERT용]                    │
└────────────────────────────────────────────────────────┘
```

### 3.3 발주 등록 (변경)

PO 품목에 치수 컬럼 추가. 같은 강종을 치수별로 여러 줄 추가 가능:

```
┌─ 발주 품목 ──────────────────────────────────────────────────────┐
│ #  자재         가로  세로  높이  건당중량   수량  총중량    금액   │
│ 1  [AL6061 ▼]  [400] [300] [350] 113.82kg  [3]  341.46kg 4,097K │
│ 2  [AL6061 ▼]  [500] [200] [150]  40.65kg  [2]   81.30kg   976K │
│ 3  [NAK80  ▼]  [300] [300] [200] 141.30kg  [1]  141.30kg 1,201K │
│ ────────────────────────────────────────────────────────────────  │
│ 합계                                        6EA  564.06kg 6,274K │
│ [+ 품목 추가]                                                     │
└──────────────────────────────────────────────────────────────────┘
```

### 3.4 입고 + 태그 부여 (변경)

입고 시 태그에 **치수가 PO Item에서 자동 상속**:

```
┌─ STEEL 입고 처리 ────────────────────────────────────────────────┐
│ 발주: PO-2026-005                                                 │
│                                                                    │
│ 품목 1: AL6061 (400×300×350) | 발주 3EA, 미입고 3EA               │
│ 입고 수량: [3] EA                                                  │
│ ┌─ 태그 등록 ───────────────────────────────────────────────────┐ │
│ │ #  태그 번호           치수(mm)        중량(kg)    위치        │ │
│ │ 1  [AL6061-2602-001]  400×300×350   [113.5]     [A-1-3]     │ │
│ │ 2  [AL6061-2602-002]  400×300×350   [114.1]     [A-1-4]     │ │
│ │ 3  [AL6061-2602-003]  400×300×350   [113.8]     [A-2-1]     │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ 품목 2: AL6061 (500×200×150) | 발주 2EA, 미입고 2EA               │
│ 입고 수량: [2] EA                                                  │
│ ┌─ 태그 등록 ───────────────────────────────────────────────────┐ │
│ │ #  태그 번호           치수(mm)        중량(kg)    위치        │ │
│ │ 4  [AL6061-2602-004]  500×200×150   [40.3]      [B-1-1]     │ │
│ │ 5  [AL6061-2602-005]  500×200×150   [41.0]      [B-1-2]     │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ [입고 완료]                                                        │
└────────────────────────────────────────────────────────────────────┘
```

### 3.5 재고 관리 — 태그 뷰 (변경)

태그에 치수가 포함되어 **같은 AL6061이라도 치수별로 구분** 가능:

```
┌─ 강재 태그 재고 ─────────────────────────────────────────────────┐
│ 필터: [강종: AL6061 ▼] [상태: 전체 ▼]                            │
│                                                                    │
│ 태그 번호         강종     치수(mm)      중량     상태   프로젝트  │
│ AL6061-2602-001  AL6061  400×300×350  113.5kg  가용   —          │
│ AL6061-2602-002  AL6061  400×300×350  114.1kg  할당   P-2026-005 │
│ AL6061-2602-003  AL6061  400×300×350  113.8kg  가용   —          │
│ AL6061-2602-004  AL6061  500×200×150   40.3kg  사용중 P-2026-007 │
│ AL6061-2602-005  AL6061  500×200×150   41.0kg  가용   —          │
│                                                                    │
│ AL6061 재고 요약: 가용 3EA (267.3kg) | 할당 1EA | 사용중 1EA      │
└────────────────────────────────────────────────────────────────────┘
```

---

## 4. 엔티티 변경 상세

### 4.1 domain/shared/entities.ts 변경

```typescript
// ── Material: STEEL 치수 필드를 optional로 유지하되, 의미 변경 ──
// v1: dimension_w/l/h = 마스터 고정 치수
// v2: dimension_w/l/h = "기본 치수" (참고용, 발주 시 기본값으로 사용)
//     이 필드들은 더 이상 필수가 아니며, 실제 치수는 PO Item / Tag에서 관리
//     weight 필드도 제거 (고정 중량 개념이 없어짐)

export interface Material {
  // ... 기존 공통 필드 유지

  // ── STEEL 전용 ──
  steel_grade?: string;
  density?: number;
  dimension_w?: number;       // v2: "기본 치수" (발주 폼 기본값, optional)
  dimension_l?: number;
  dimension_h?: number;
  weight?: number;            // v2: deprecated — 기본 치수 기반 참고값
  price_per_kg?: number;
  weight_method?: SteelWeightMethod;

  // ... TOOL, CONSUMABLE 필드 유지
}

// ── PurchaseOrderItem: 치수 추가 ──
export interface PurchaseOrderItem {
  id: string;
  material_id: string;
  quantity: number;
  unit_price: number;
  received_quantity?: number;

  // v2 추가
  dimension_w?: number;
  dimension_l?: number;
  dimension_h?: number;
  piece_weight?: number;      // density × W × L × H / 1e6
  total_weight?: number;      // piece_weight × quantity
}

// ── PurchaseRequest: 치수 추가 ──
export interface PurchaseRequest {
  // ... 기존 필드 유지

  // v2 추가
  dimension_w?: number;
  dimension_l?: number;
  dimension_h?: number;
  piece_weight?: number;
}

// ── SteelTag: 치수 추가 ──
export interface SteelTag {
  // ... 기존 필드 유지

  // v2 추가
  po_item_id?: string;        // PO Item 참조
  dimension_w?: number;
  dimension_l?: number;
  dimension_h?: number;
}
```

### 4.2 하위 호환성

- Material의 `dimension_w/l/h`와 `weight`는 **optional이므로 기존 코드 깨지지 않음**
- 기존 Mock 데이터의 STEEL 자재 3건(mat1, mat2, mat3)에 치수가 있으면 "기본 치수"로 활용
- PurchaseOrderItem, PurchaseRequest, SteelTag의 신규 필드도 모두 optional
- 기존 입고 워크플로우에서 치수가 없는 태그도 정상 동작 (치수 미기재)

### 4.3 STEEL_GRADE_DENSITY 확장

현재 코드에는 철계 강종 8종만 등록되어 있다. v2에서 알루미늄·동합금·스테인리스를 추가한다:

```typescript
// types/display.ts — STEEL_GRADE_DENSITY 확장
export const STEEL_GRADE_DENSITY: Record<string, number> = {
  // ── 금형강 (철계) ──
  'NAK80': 7.85,
  'SKD11': 7.70,
  'SKD61': 7.76,
  'S45C': 7.85,
  'SUS304': 7.93,
  'SCM440': 7.85,
  'P20': 7.85,
  'STAVAX': 7.80,
  'HPM38': 7.81,
  'DC53': 7.87,

  // ── 알루미늄 합금 ──
  'AL6061': 2.71,
  'AL7075': 2.81,
  'AL5052': 2.68,
  'AL2024': 2.78,

  // ── 동합금 ──
  'C1100': 8.94,      // 순동 (방전 전극 소재)
  'C2801': 8.50,      // 황동

  // ── 스테인리스 ──
  'SUS420J2': 7.75,
  'SUS440C': 7.70,
};
```

**관련 코드 변경 파일**: `types/display.ts`, `hooks/materials/useMaterialForm.ts` (강종 드롭다운에 자동 반영)

---

## 5. Supabase 마이그레이션

```sql
-- v2: 치수를 PO Item / PR / SteelTag 레벨로 이동

-- 1) purchase_order_items 테이블 치수 추가
ALTER TABLE public.purchase_order_items
  ADD COLUMN IF NOT EXISTS dimension_w   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS dimension_l   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS dimension_h   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS piece_weight  NUMERIC(12,4),
  ADD COLUMN IF NOT EXISTS total_weight  NUMERIC(12,4);

COMMENT ON COLUMN public.purchase_order_items.dimension_w  IS '가로 (mm) — STEEL 발주 시 지정';
COMMENT ON COLUMN public.purchase_order_items.piece_weight IS '건당 이론 중량 (kg)';
COMMENT ON COLUMN public.purchase_order_items.total_weight IS '총 중량 (kg)';

-- 2) purchase_requests 테이블 치수 추가
ALTER TABLE public.purchase_requests
  ADD COLUMN IF NOT EXISTS dimension_w   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS dimension_l   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS dimension_h   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS piece_weight  NUMERIC(12,4);

-- 3) steel_tags 테이블 치수 + PO Item 참조 추가
ALTER TABLE public.steel_tags
  ADD COLUMN IF NOT EXISTS po_item_id   TEXT,
  ADD COLUMN IF NOT EXISTS dimension_w  NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS dimension_l  NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS dimension_h  NUMERIC(10,2);

COMMENT ON COLUMN public.steel_tags.po_item_id  IS '발주 품목 참조 (입고 출처)';
COMMENT ON COLUMN public.steel_tags.dimension_w IS '가로 (mm) — 태그별 실제 치수';

-- 4) materials 테이블: dimension/weight 필드는 유지 (하위 호환)
--    운영 데이터에서 점진적으로 "기본 치수" 개념으로 전환
--    신규 등록 시 치수 입력은 선택사항으로 변경
```

---

## 6. UI/UX 변경 요약

### 6.1 자재 등록/편집 (`/materials/items/new`, `/materials/items/[id]`)

| 항목 | v1 (현재) | v2 (변경) |
|------|----------|----------|
| STEEL 치수 입력 | 필수 — 마스터에 고정 | 선택 — "기본 치수" (발주 시 기본값) |
| 이론 중량 표시 | 항상 표시 | 기본 치수 입력 시만 참고 표시 |
| 안내 문구 | "구매: KG \| 재고: 태그 EA" | "치수는 발주/구매요청 시 지정. 기본 치수를 입력하면 발주 폼에서 기본값으로 사용" |

### 6.2 구매 요청 (`/materials/purchase-requests/new`)

- STEEL 자재 선택 시 **치수 입력 필드 노출** (가로/세로/높이)
- 마스터에 기본 치수가 있으면 **기본값으로 자동 입력** (수정 가능)
- 치수 입력 → 건당 중량 자동 계산 → 수량 × 건당 중량 = 총 중량 → 예상 금액 표시

### 6.3 발주 등록 (`/materials/purchase-orders/new`)

- 품목 테이블에 **가로/세로/높이 컬럼 추가** (STEEL만)
- 같은 강종을 다른 치수로 여러 줄 추가 가능
- 치수 입력 → 건당 중량, 총 중량, 금액 자동 계산
- 구매 요청에서 전환된 경우 치수 자동 상속

### 6.4 발주 상세 (`/materials/purchase-orders/[id]`)

- 품목 테이블에 치수 컬럼 표시
- 각 품목별 건당 중량, 총 중량 표시

### 6.5 입고 등록 (`/materials/receiving/new`)

- PO 품목에 치수가 있으면 → 태그에 치수 자동 상속
- 태그 테이블에 치수 컬럼 표시 (읽기 전용, PO Item에서 상속)
- 직접 입고 시 치수 수기 입력 가능

### 6.6 재고 현황 (`/materials/inventory`)

- 태그 뷰에 치수 컬럼 추가
- 같은 강종이라도 치수별로 구분 표시
- 필터에 치수 범위 검색 추가 (향후)

### 6.7 자재 상세 (`/materials/items/[id]`)

- 태그 현황 테이블에 치수 컬럼 추가
- "치수별 재고 요약" 카드 추가 (같은 AL6061의 치수별 가용 수량)

---

## 7. 영향 범위 분석

### 7.1 엔티티 + 타입 변경

| 파일 | 변경 |
|------|------|
| `domain/shared/entities.ts` | PurchaseOrderItem, PurchaseRequest, SteelTag에 치수 필드 추가 |
| `types/index.ts` | (자동 반영 — re-export) |
| `types/display.ts` | STEEL_GRADE_DENSITY에 알루미늄(AL6061, AL7075 등) + 동합금 + 스테인리스 12종 추가 |

### 7.2 Infrastructure 변경

| 파일 | 변경 |
|------|------|
| `infrastructure/repositories/in-memory/procurement.ts` | PO Item 생성/조회 시 치수 필드 포함 |
| `infrastructure/repositories/in-memory/materials.ts` | SteelTag 생성 시 치수 필드 포함 |
| `infrastructure/repositories/supabase/procurement.ts` | PO Item 치수 컬럼 매핑 |
| `infrastructure/repositories/supabase/materials.ts` | SteelTag 치수 컬럼 매핑 |

### 7.3 Hooks 변경

| 파일 | 변경 |
|------|------|
| `hooks/procurement/usePurchaseOrderForm.ts` | 품목별 치수 입력 + 중량/금액 계산 로직 |
| `hooks/materials/useSteelTagAutoGeneration.ts` | PO Item 치수 → 태그 치수 상속 |
| `hooks/materials/useReceivingWorkflows.ts` | 태그 생성 시 치수 전달 |
| `hooks/procurement/usePurchaseRequests.ts` | 요청 생성 시 치수 포함 |

### 7.4 Presentation 변경

| 파일 | 변경 |
|------|------|
| `app/materials/items/new/` | STEEL 치수 입력을 "기본 치수 (선택)" 으로 변경 |
| `app/materials/items/[id]/` | 태그 테이블에 치수 컬럼 |
| `app/materials/purchase-requests/new/` | 치수 입력 필드 추가 |
| `app/materials/purchase-orders/new/` | 품목 테이블에 치수 컬럼 추가 |
| `app/materials/purchase-orders/[id]/` | 품목 상세에 치수 표시 |
| `app/materials/receiving/new/` | 태그 테이블에 치수 컬럼 (PO Item에서 상속) |
| `app/materials/inventory/` | 태그 뷰에 치수 컬럼 추가 |

### 7.5 변경하지 않는 영역

- Store slices (치수 필드는 엔티티에 추가되므로 slice 구조 변경 불필요)
- Domain services, use-cases (치수는 presentation/hook 레벨에서 처리)
- 비-STEEL 자재 워크플로우 전체
- 영업/프로젝트/생산/품질 모듈

---

## 8. Mock 데이터 변경

### 8.1 Material — 기존 STEEL 3건 + AL6061 신규 1건

```typescript
// mat1: NAK80 — 치수를 "기본 치수"로 유지 (하위 호환)
{ id: 'mat1', name: 'NAK80', steel_grade: 'NAK80', density: 7.85,
  dimension_w: 400, dimension_l: 300, dimension_h: 350,  // "기본 치수"
  weight: 329.70, price_per_kg: 8500, weight_method: 'MEASURED' }

// mat2: SKD11 — 기본 치수 유지
{ id: 'mat2', name: 'SKD11', steel_grade: 'SKD11', density: 7.70,
  dimension_w: 500, dimension_l: 400, dimension_h: 300,
  weight: 462.0, price_per_kg: 6926, weight_method: 'MEASURED' }

// mat3: SKD61 — 기본 치수 유지
{ id: 'mat3', name: 'SKD61', steel_grade: 'SKD61', density: 7.76,
  dimension_w: 600, dimension_l: 500, dimension_h: 350,
  weight: 814.8, price_per_kg: 5032, weight_method: 'CALCULATED' }

// ── v2 신규: AL6061 (알루미늄) — 치수 없이 강종 마스터만 등록 ──
// 다양한 치수는 발주/구매요청에서 지정
{ id: 'mat15', material_code: 'STL-AL6061', name: 'AL6061 알루미늄',
  category: 'STEEL', unit: 'KG', inventory_unit: 'EA',
  steel_grade: 'AL6061', density: 2.71,
  price_per_kg: 12000, weight_method: 'MEASURED',
  // dimension_w/l/h: 없음 — 발주 시 치수 지정
  // weight: 없음 — 고정 중량 없음
  safety_stock: 5, lead_time: 5, supplier_id: 'sup1' }
```

### 8.2 SteelTag — 기존 5건에 치수 추가

```typescript
// 기존 태그에 치수 역보충 (Material의 기본 치수 상속)
{ id: 'stag1', material_id: 'mat1', tag_no: 'NAK80-2601-001',
  weight: 328.5, dimension_w: 400, dimension_l: 300, dimension_h: 350,
  status: 'IN_USE', ... }

{ id: 'stag2', material_id: 'mat1', tag_no: 'NAK80-2601-002',
  weight: 330.1, dimension_w: 400, dimension_l: 300, dimension_h: 350,
  status: 'AVAILABLE', ... }
// ... 나머지 동일 패턴
```

### 8.3 PurchaseOrderItem — 기존 PO 품목에 치수 추가 + AL6061 발주 신규

기존 Mock PO의 items에 치수 필드 역보충 (Material 기본 치수 사용).

```typescript
// ── v2 신규 PO: AL6061 다양한 치수 발주 ──
{ id: 'po5', po_no: 'PO-2026-005', supplier_id: 'sup1',
  status: 'ORDERED', order_date: '2026-02-10', due_date: '2026-02-20',
  total_amount: 5658480,
  items: [
    // 같은 AL6061, 다른 치수 3줄
    { id: 'poi7', material_id: 'mat15', quantity: 3, unit_price: 1365840,
      dimension_w: 400, dimension_l: 300, dimension_h: 350,
      piece_weight: 113.82, total_weight: 341.46 },
    { id: 'poi8', material_id: 'mat15', quantity: 2, unit_price: 487800,
      dimension_w: 500, dimension_l: 200, dimension_h: 150,
      piece_weight: 40.65, total_weight: 81.30 },
    { id: 'poi9', material_id: 'mat15', quantity: 1, unit_price: 585360,
      dimension_w: 300, dimension_l: 300, dimension_h: 200,
      piece_weight: 48.78, total_weight: 48.78 },
  ],
}
```

### 8.4 SteelTag — AL6061 입고 후 태그 예시

```typescript
// PO-2026-005 입고 시 생성되는 태그 (치수는 PO Item에서 상속)
{ id: 'stag6', material_id: 'mat15', tag_no: 'AL6061-2602-001',
  weight: 113.5, dimension_w: 400, dimension_l: 300, dimension_h: 350,
  status: 'AVAILABLE', purchase_order_id: 'po5', po_item_id: 'poi7',
  location: 'A-3-1', received_at: '2026-02-12' },
{ id: 'stag7', material_id: 'mat15', tag_no: 'AL6061-2602-002',
  weight: 114.1, dimension_w: 400, dimension_l: 300, dimension_h: 350,
  status: 'AVAILABLE', purchase_order_id: 'po5', po_item_id: 'poi7',
  location: 'A-3-2', received_at: '2026-02-12' },
{ id: 'stag8', material_id: 'mat15', tag_no: 'AL6061-2602-003',
  weight: 113.8, dimension_w: 400, dimension_l: 300, dimension_h: 350,
  status: 'AVAILABLE', purchase_order_id: 'po5', po_item_id: 'poi7',
  location: 'A-3-3', received_at: '2026-02-12' },
{ id: 'stag9', material_id: 'mat15', tag_no: 'AL6061-2602-004',
  weight: 40.3, dimension_w: 500, dimension_l: 200, dimension_h: 150,
  status: 'AVAILABLE', purchase_order_id: 'po5', po_item_id: 'poi8',
  location: 'B-2-1', received_at: '2026-02-12' },
{ id: 'stag10', material_id: 'mat15', tag_no: 'AL6061-2602-005',
  weight: 41.0, dimension_w: 500, dimension_l: 200, dimension_h: 150,
  status: 'AVAILABLE', purchase_order_id: 'po5', po_item_id: 'poi8',
  location: 'B-2-2', received_at: '2026-02-12' },
{ id: 'stag11', material_id: 'mat15', tag_no: 'AL6061-2602-006',
  weight: 48.5, dimension_w: 300, dimension_l: 300, dimension_h: 200,
  status: 'AVAILABLE', purchase_order_id: 'po5', po_item_id: 'poi9',
  location: 'B-2-3', received_at: '2026-02-12' },
```

---

## 9. 구현 단계

### Phase 1: 엔티티 + 인프라 (기반)

| # | 작업 | 파일 | 설명 |
|---|------|------|------|
| 1-1 | 엔티티 확장 | `domain/shared/entities.ts` | PurchaseOrderItem, PurchaseRequest, SteelTag에 치수 필드 추가 |
| 1-2 | 강종 밀도 확장 | `types/display.ts` | STEEL_GRADE_DENSITY에 AL6061, AL7075, C1100 등 12종 추가 |
| 1-3 | Mock 데이터 | `lib/mock-data.ts` | AL6061 자재 신규, 기존 SteelTag에 치수 역보충, PO Item에 치수 역보충, AL6061 발주/태그 Mock 추가 |
| 1-4 | 유틸리티 | `lib/utils.ts` | `calcSteelWeight(density, w, l, h)` 이미 존재 — 변경 없음 |
| 1-5 | InMemory 레포 | `infrastructure/repositories/in-memory/` | 치수 필드 자동 포함 (TypeScript 타입 확장으로 충분) |

**검증**: `npx tsc --noEmit` + `npm run build` 성공

### Phase 2: 발주 + 구매요청 UI

| # | 작업 | 파일 | 설명 |
|---|------|------|------|
| 2-1 | 발주 등록 | `app/materials/purchase-orders/new/`, `hooks/procurement/usePurchaseOrderForm.ts` | 품목별 치수 입력, 중량/금액 자동 계산 |
| 2-2 | 발주 상세 | `app/materials/purchase-orders/[id]/` | 품목 테이블에 치수 표시 |
| 2-3 | 구매 요청 등록 | `app/materials/purchase-requests/new/` | 치수 입력 필드 추가 |
| 2-4 | 구매 요청 → 발주 전환 | `hooks/procurement/usePurchaseRequests.ts` | 치수 상속 |

**검증**: AL6061 하나로 다른 치수 3건 발주 생성 가능

### Phase 3: 입고 + 태그

| # | 작업 | 파일 | 설명 |
|---|------|------|------|
| 3-1 | 입고 등록 | `app/materials/receiving/new/`, `hooks/materials/useSteelTagAutoGeneration.ts` | PO Item 치수 → 태그 치수 자동 상속 |
| 3-2 | 워크플로우 | `hooks/materials/useReceivingWorkflows.ts` | 태그 생성 시 치수 + po_item_id 전달 |
| 3-3 | 직접 입고 | `app/materials/receiving/new/` | 직접 입고 시 치수 수기 입력 |

**검증**: 발주 → 입고 → 태그에 치수 자동 반영

### Phase 4: 재고 + 자재 마스터 UI

| # | 작업 | 파일 | 설명 |
|---|------|------|------|
| 4-1 | 자재 등록 | `app/materials/items/new/` | STEEL 치수를 "기본 치수 (선택)"으로 변경 |
| 4-2 | 자재 상세 | `app/materials/items/[id]/` | 태그 테이블에 치수 컬럼, 치수별 재고 요약 |
| 4-3 | 재고 현황 | `app/materials/inventory/` | 태그 뷰에 치수 컬럼 추가 |
| 4-4 | 자재 목록 | `app/materials/items/` | 재고 표시에 치수 다양성 반영 |

**검증**: 전체 E2E — 자재 등록 → 구매 요청 → 발주 → 입고 → 재고 확인

### Phase 5: Supabase 마이그레이션 (선택)

| # | 작업 | 설명 |
|---|------|------|
| 5-1 | DDL | purchase_order_items, purchase_requests, steel_tags 테이블 치수 컬럼 추가 |
| 5-2 | 레포 업데이트 | Supabase repository에서 치수 컬럼 매핑 |
| 5-3 | 데이터 마이그레이션 | 기존 태그에 Material 기본 치수 역보충 |

---

## 10. 테스트 시나리오

### 10.1 핵심 시나리오: 동일 강종, 다양한 치수 발주

1. **자재 등록**: AL6061 (밀도 2.71, kg단가 12,000원) — 치수 미입력
2. **구매 요청 3건**:
   - PR-1: AL6061 400×300×350, 3EA (건당 113.82kg)
   - PR-2: AL6061 500×200×150, 2EA (건당 40.65kg)
   - PR-3: AL6061 300×300×200, 1EA (건당 48.78kg)
3. **발주 생성**: 3건 요청을 하나의 PO로 통합 → 3줄 품목, 총 6EA, 564.06kg
4. **입고 처리**:
   - 품목 1 (400×300×350, 3EA): 태그 3건 생성, 각 치수 400×300×350, 중량 실측 입력
   - 품목 2 (500×200×150, 2EA): 태그 2건 생성, 각 치수 500×200×150
   - 품목 3 (300×300×200, 1EA): 태그 1건 생성
5. **재고 확인**:
   - AL6061 총 6EA (AVAILABLE)
   - 태그별 치수/중량 개별 표시
   - 치수별 그룹핑 가능: 400×300×350 3EA, 500×200×150 2EA, 300×300×200 1EA

### 10.2 하위 호환 시나리오

1. 기존 NAK80 (기본 치수 400×300×350) 자재 상세 정상 표시
2. 기존 SteelTag 5건에 치수가 역보충되어 정상 표시
3. 기본 치수가 있는 자재의 발주 등록 시 치수 자동 입력 (수정 가능)

### 10.3 직접 입고 시나리오

1. PO 없이 AL6061 직접 입고
2. 치수 수기 입력: 350×250×200
3. 태그 생성 시 입력한 치수 반영

---

## 11. 향후 확장 포인트

| 항목 | 설명 | 시기 |
|------|------|------|
| **치수별 재고 검색** | "400×300 이상 블록 검색" 등 치수 범위 필터 | Phase 2+ |
| **잔재(端材) 관리** | 가공 후 남은 잔재를 별도 태그로 등록, 원래 태그 참조 | Phase 2+ |
| **BOM → 자동 구매 요청** | BOM에 필요 치수 명시 → 자동으로 치수 포함 PR 생성 (아래 11.1 참조) | Phase 3+ |
| **치수 기반 잔재 매칭** | 잔재 치수와 새 발주 치수 비교 → 재사용 제안 | Phase 3+ |
| **강종 마스터 테이블** | 현재 상수(STEEL_GRADE_DENSITY) → DB 테이블로 전환 (아래 11.2 참조) | Phase 2+ |
| **입고 칭량 연동** | 저울 장비 연동으로 MEASURED 자재의 중량 자동 입력 | Phase 3+ |
| **STEEL → METAL 카테고리 리네이밍** | 비철 금속 포괄을 명확히 하는 카테고리명 변경 | Phase 2+ |
| **태그 QR/바코드 라벨 인쇄** | 태그 번호 + 치수 + 중량 정보를 라벨로 출력 | Phase 2+ |

### 11.1 BOM → 치수 포함 구매 요청 자동 생성

BOM 관리 모듈(PRD 3.3.3) 구현 시, 각 BOM 항목에 **강종 + 치수**를 명시하여 구매 요청을 자동 생성:

```
BOM (프로젝트 PJ-2026-008)
├── CORE: AL6061 (400×300×350)     → PR 자동 생성 (치수 포함)
├── CAVITY: AL6061 (400×300×280)   → PR 자동 생성 (치수 포함)
├── SLIDE: AL6061 (200×150×100)    → PR 자동 생성 (치수 포함)
└── BASE: S45C (500×400×200)       → PR 자동 생성 (치수 포함)

→ 동일 강종(AL6061) 3건은 하나의 PO로 통합 가능 (공급처 동일 시)
→ S45C는 별도 PO로 분리
```

이때 `PurchaseRequest.dimension_w/l/h`에 BOM 치수가 자동 설정되므로, v2의 데이터 모델이 선행 조건이 된다.

### 11.2 강종 마스터 DB 테이블 전환

현재 `STEEL_GRADE_DENSITY`는 TypeScript 상수이므로 강종 추가 시 코드 배포가 필요하다. 운영 단계에서는 DB 테이블로 전환:

```sql
CREATE TABLE public.metal_grades (
  id          TEXT PRIMARY KEY,
  grade_code  TEXT NOT NULL UNIQUE,    -- 'AL6061', 'NAK80'
  grade_name  TEXT NOT NULL,           -- 'AL6061 알루미늄 합금'
  metal_type  TEXT NOT NULL,           -- 'STEEL' | 'ALUMINUM' | 'COPPER' | 'STAINLESS'
  density     NUMERIC(6,3) NOT NULL,   -- g/cm3
  default_price_per_kg NUMERIC(12,2),  -- 참고 단가
  is_active   BOOLEAN DEFAULT true,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

이 테이블이 도입되면 `Material.steel_grade`가 `metal_grades.id`를 참조하는 FK로 전환된다.

---

## 12. 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2026-02-10 | v2.0 | 치수를 Material 마스터에서 PO Item / PR / SteelTag 레벨로 분리. HMLV 금속 원자재 "동일 강종, 다양한 치수" 발주 패턴 지원. plan_v1.md의 STEEL 치수 모델을 대체. |
| 2026-02-10 | v2.1 | **알루미늄/비철 금속 확장**: STEEL 카테고리의 금속 원자재 범위 명확화 (섹션 1.4), STEEL_GRADE_DENSITY에 AL6061/AL7075/동합금 등 12종 추가 (섹션 4.3), AL6061 Mock 데이터 예시 추가 (섹션 8.1~8.4), BOM 연동 및 강종 마스터 DB 테이블 확장 설계 (섹션 11.1~11.2). plan_v1.md, m_p_plan.md 연동 업데이트. |
