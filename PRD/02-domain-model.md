# 2. 핵심 도메인 모델

### 2.1 ERD 핵심 엔티티

```
Customer (고객)
├── Quote (견적)
│   └── QuoteItem (견적 항목)
├── Order (수주)
│   └── OrderItem (수주 항목) ── 1:1 ── Project (프로젝트/금형)
│
Project (프로젝트 = 금형 1개)
├── BOM (자재 명세)
│   └── BOMItem (BOM 항목)
├── ProcessPlan (공정 계획)
│   └── ProcessStep (공정 단계)
│       └── WorkOrder (작업 지시)
│           └── WorkLog (작업 실적)
├── QualityInspection (품질 검사)
├── DesignChange (설계 변경)
└── ProjectCost (프로젝트 원가)
│
Material (자재/부품)
├── MaterialStock (재고)
├── PurchaseRequest (구매 요청) ── project_id → Project
│   └── PurchaseOrder (발주) ── project_id → Project
│       └── GoodsReceipt (입고) ── project_id 전파
│
Outsource (외주)
├── OutsourceRequest (외주 요청)
└── OutsourceOrder (외주 발주)
│
Machine (설비)
├── MachineSchedule (설비 스케줄)
└── MaintenanceLog (설비 보전)
│
Employee (직원)
└── SkillMatrix (숙련도)
```

### 2.2 프로젝트(금형) 상태 흐름

프로젝트 상태는 공정 단계(ProcessStep)의 진행에 의해 자동 전환된다.
설계 역시 하나의 공정 단계로서 동일한 작업 지시/실적/원가 추적 체계를 따른다.

```
수주확정 → [설계 공정] → [자재 준비] → [가공 공정] → [조립 공정]
→ [트라이아웃] → [수정/보완] → [최종검사] → 출하 → 납품완료 → A/S

* 설계 공정 세부: 3D모델링 → 2D도면 → 설계검토 → BOM확정
* 가공 공정 세부: 황삭 → MCT → 방전 → 와이어 → 연마 (금형 유형별 상이)
* [수정/보완] → [트라이아웃]은 승인될 때까지 반복 가능
```

프로젝트 상태 자동 전환 규칙:
| 트리거 | 프로젝트 상태 변경 |
|--------|-------------------|
| 수주 확정 (Order 생성) | → `수주확정` + 설계 공정 4단계 자동 시드 (DESIGN_3D/2D/REVIEW/BOM) |
| 첫 번째 설계 공정 시작 | → `설계중` |
| 모든 설계 공정 완료 | → `설계완료` |
| 자재 준비 공정 시작 | → `자재준비` |
| 첫 번째 가공 공정 시작 | → `가공중` |
| 조립 공정 시작 | → `조립중` |
| 트라이아웃 공정 시작 | → `트라이아웃` |
| 최종검사 합격 | → `출하가능` |

> **구현 완료**: `resolveProjectStatusFromSteps()` — 공정 단계 완료 상태를 기반으로 프로젝트 상태를 자동 산출한다.
> `isStatusLater()` 가드로 상태 전환은 전진(forward-only)만 허용한다 (역행 방지).
> WorkOrder START/COMPLETE 시 연결된 ProcessStep과 Project 상태가 자동 동기화된다.

### 2.3 수주→설계→구매→생산 E2E 데이터 흐름

프로젝트 기준(`project_id`)으로 전 도메인의 데이터가 연결된다:

```
Order(수주) → Project(프로젝트) → ProcessStep(설계4단계 자동시드)
  └→ DESIGN_BOM 완료 → PurchaseRequest(구매요청) 자동 생성 (project_id 전파)
       └→ PurchaseOrder(발주) 프로젝트별 자동 분할 (project_id 설정)
            └→ 입고 → StockMovement(IN) + SteelTag에 project_id 전파
                 └→ 출고(STOCK_OUT) → 자동분개 (WIP DR / Material CR, project_id 포함)
```

- **ConvertRequestsToPO**: 혼합 프로젝트 PR → 프로젝트별 PO 자동 분할 (`purchaseOrders[]` 다건 반환)
- **자동분개 project_id**: PO_ORDERED, STOCK_OUT 분개 라인에 `project_id` 포함
- **데이터 정합성**: `/admin/data-integrity`에서 project_id 누락률, 상태 불일치, 문서 연결 누락 점검

---

