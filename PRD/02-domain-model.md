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
├── PurchaseRequest (구매 요청)
│   └── PurchaseOrder (발주)
│       └── GoodsReceipt (입고)
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
| 첫 번째 설계 공정 시작 | → `설계중` |
| 모든 설계 공정 완료 | → `설계완료` |
| 자재 준비 공정 시작 | → `자재준비` |
| 첫 번째 가공 공정 시작 | → `가공중` |
| 조립 공정 시작 | → `조립중` |
| 트라이아웃 공정 시작 | → `트라이아웃` |
| 최종검사 합격 | → `출하가능` |

---

