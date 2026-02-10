# 7. 핵심 비즈니스 규칙

### 7.1 프로젝트 상태 전이 규칙 (공정 기반 자동 전환)
```
- 수주확정 시: 설계 공정 4단계(DESIGN_3D/2D/REVIEW/BOM) 자동 시드 (idempotent, CreateOrderWithProjectUseCase)
- 수주확정 → 설계중: 설계 공정(DESIGN_3D) 작업 시작 시 자동 전환. 설계자 배정 필수.
- 설계중 → 설계완료: 모든 설계 공정(DESIGN_3D/2D/REVIEW/BOM) 완료 시 자동 전환.
                     DESIGN_REVIEW 승인 및 BOM 확정 필수.
- DESIGN_BOM 완료 시: BOM 항목 기반 구매요청(PR) 자동 생성 (CreatePurchaseRequestsFromBomUseCase, 멱등)
- 설계완료 → 자재준비: MATERIAL_PREP 공정 시작 시 자동 전환. BOM 확정 필수.
- 자재준비 → 가공중: 첫 가공 공정 작업 시작 시 자동 전환. 핵심 자재 입고 완료 필수.
- 조립중 → 트라이아웃: TRYOUT 공정 시작 시. 조립 완료 검사 통과 필수.
- 최종검사 → 출하: FINAL_INSPECTION 합격 시. 최종 검사 합격 필수.
- 상태 전환은 forward-only: isStatusLater() 가드로 역행 방지
- WorkOrder START/COMPLETE → ProcessStep + Project 상태 자동 동기화 (resolveProjectStatusFromSteps)
```

### 7.1.1 공정 간 선후행 제약
```
- DESIGN_3D → DESIGN_2D → DESIGN_REVIEW → DESIGN_BOM (설계 내부 순차)
- DESIGN_BOM 완료 → MATERIAL_PREP 시작 가능 (설계 → 자재 경계)
- MATERIAL_PREP 완료 → 가공 공정 시작 가능 (자재 → 가공 경계)
- 모든 가공 공정 완료 → ASSEMBLY 시작 가능
- ASSEMBLY 완료 → TRYOUT 시작 가능
- TRYOUT 결과에 따라 → 수정 공정 재생성 가능 (반복 루프)
```

### 7.2 견적 원가 산출
```
총 견적가 = 자재비 + 설계비 + 가공비 + 외주비 + 관리비 + 이익
- 자재비 = Σ(강재 중량 × 단가) + Σ(표준부품 수량 × 단가)
- 설계비 = Σ(설계 공정별 예상시간 × 설계 시간당 단가)
- 가공비 = Σ(가공 공정별 예상시간 × 설비 시간당 단가)
- 외주비 = Σ(외주 공정별 예상 단가)
- 관리비 = (자재비 + 설계비 + 가공비 + 외주비) × 관리비율
- 이익 = 소계 × 이익률
```

### 7.3 프로젝트 원가 집계
```
실 원가 = 자재비(실) + 노무비(실) + 경비(배부) + 외주비(실)
- 자재비: 프로젝트 출고 자재의 실구매 단가 기준
- 노무비: 작업 실적 시간 × 인건비 단가
  ├ 설계 노무비: 설계 공정 WorkLog 시간 × 설계 인건비 단가
  └ 가공 노무비: 가공 공정 WorkLog 시간 × 현장 인건비 단가
- 경비: 설비 사용시간 기준 배부 (설계 공정은 설비 경비 없음)
- 외주비: 외주 발주 실 금액
```

### 7.4 재고 관리
```
- 입고 시: 재고 수량 증가, 이동평균 단가 재계산
- 출고 시: 프로젝트에 원가 귀속
- 안전재고 미달 시: 구매 담당자 자동 알림
- 잔재(강재 자투리): 별도 관리, 재사용 시 원가 차감
```

### 7.5 회계 자동분개 규칙
```
- 모든 분개는 복식부기(차변합 = 대변합)를 강제한다.
- 자동분개 키: (source_type, source_id, event_type)는 유일해야 하며 중복 생성 금지.
- 원천 문서 상태가 취소/반려로 변경되면 기존 분개를 삭제하지 않고 역분개를 생성한다.
- 마감된 회계기간의 전표는 수정/삭제 금지 (재오픈 승인 전까지 잠금).
- 품목 입고 분개의 차변 계정은 `materials.accounting_item_type`(또는 품목 Override 계정)을 우선 적용한다.
- 품목 입고 분개의 대변 계정은 `purchase_orders.settlement_type`에 따라 자동 선택한다.
  - `CREDIT` → 매입채무(AP, 외상매입금)
  - `CASH` → 보통예금/현금
- 금액 기준:
  - 구매/입고: PO 품목 단가, 입고 수량
  - 재고출고: stock.avg_unit_price(이동평균 단가)
  - 노무비(확장): work_logs.duration × profiles.hourly_rate
- 계정과목은 회사별 정책 테이블에서 매핑 가능해야 하며, 기본값은 시스템 표준 계정 사용.
```

구현 완료된 자동분개 트리거 (AutoPostingService):

| event_type | 트리거 | DR 계정 | CR 계정 | project_id |
|------------|--------|---------|---------|------------|
| ORDER_CONFIRMED | 수주 확정 | 매출채권(1100) | 매출(4000) | — |
| PAYMENT_CONFIRMED | 입금 확정 | 보통예금(1000) | 매출채권(1100) | — |
| PO_ORDERED | 발주 생성 | 원재료(1200) | 매입채무(2100) | PO.project_id |
| STOCK_OUT | 재고 출고 | 재공품(1300) | 원재료(1200) | 출고 project_id |

- Hook 계층에서 try/catch + silent fail 패턴으로 비즈니스 로직에 영향 없이 분개 트리거

### 7.6 프로젝트 기준 E2E 데이터 추적 규칙
```
- project_id는 수주→프로젝트→설계→구매요청→발주→입고→출고→분개까지 일관 전파한다.
- PurchaseRequest.project_id: BOM→PR 자동 생성 시 또는 수동 등록 시 설정
- PurchaseOrder.project_id: PR→PO 변환 시 자동 설정 (ConvertRequestsToPO)
- 혼합 프로젝트 PR → 프로젝트별 PO 자동 분할 (동일 프로젝트 PR끼리 그룹핑)
- StockMovement(IN).project_id: PO 입고 시 PO.project_id 전파
- SteelTag.project_id: PO 입고 시 PO.project_id 전파
- 분개 라인.project_id: PO_ORDERED, STOCK_OUT 분개 시 project_id 포함
- 데이터 정합성 점검: project_id 누락률, PO-PR 상태 불일치, 문서 연결 누락 (3종)
```

---

