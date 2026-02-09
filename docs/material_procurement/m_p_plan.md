# 자재 구매 관리 세부 구현 계획

> **문서 버전**: v1.0
> **작성일**: 2026-02-09
> **기준 문서**: PRD.md 섹션 3.5, 3.11.5, 7.4, 8.5

---

## 1. 현황 분석

### 1.1 구현 완료 (Implemented)

| 영역 | 기능 | 경로 | 비고 |
|------|------|------|------|
| 자재 마스터 | 품목 목록/검색/정렬 | `/materials/items` | DataTable 기반 |
| 자재 마스터 | 품목 등록 | `/materials/items/new` | 전체 필드 폼 |
| 자재 마스터 | 품목 상세 | `/materials/items/[id]` | 기본정보+재고+입출고이력 |
| 자재 마스터 | 공급처별 단가 비교 | `/materials/items/[id]` | 단가 테이블+KPI+분포 |
| 자재 마스터 | 단가 변경 이력 | `/materials/items/[id]` | 타임라인+필터+자동생성 |
| 재고 | 재고 현황 조회 | `/materials/inventory` | KPI 3종+DataTable |
| 구매 | 발주 목록 | `/materials/purchase-orders` | 상태별 필터 탭 |
| 구매 | 발주 등록 | `/materials/purchase-orders/new` | 품목 라인 동적 추가 |
| 거래처 | 거래처 목록 | `/materials/suppliers` | KPI+DataTable |
| 거래처 | 거래처 등록 | `/materials/suppliers/new` | 전체 필드 폼 |
| 거래처 | 거래처 상세 | `/materials/suppliers/[id]` | 인라인편집+발주이력+공급품목 |
| 입고 | 입고 목록 | `/materials/receiving` | KPI 3종+이력테이블 |
| 입고 | 입고 등록 | `/materials/receiving/new` | 발주기반+직접입고 |
| 입고 | 입고 시 자동 처리 | Zustand store | 재고증가+이동평균+PO상태+단가이력 |

### 1.2 미구현 요약

| 섹션 | 미구현 항목 수 | 우선순위 |
|------|--------------|---------|
| 3.5.1 자재 관리 | 3개 | HIGH |
| 3.5.2 재고 관리 | 4개 | HIGH |
| 3.5.3 구매 관리 | 4개 | MEDIUM |
| 3.5.4 거래처 관리 | 1개 (PRD 미체크이나 구현됨, 수정/삭제만 남음) | LOW |
| 3.11.5 자재/구매 통계 | 4개 | MEDIUM |
| 연계 기능 | BOM→구매, 입고검사, 프로젝트출고 | FUTURE |

---

## 2. 구현 단계 (Phases)

### Phase A — 핵심 CRUD 완성 (즉시)
> 기존 페이지의 누락 기능 보완. 코드 수정 범위 최소화.

### Phase B — 재고 트랜잭션 (단기)
> 입고/출고/조정 처리 및 프로젝트 원가 연결.

### Phase C — 구매 워크플로우 (중기)
> 구매 요청, 발주 승인 프로세스, BOM 연계.

### Phase D — 통계/분석 (중기)
> 자재/구매 통계 페이지 구현.

### Phase E — 고도화 (장기)
> 분류 체계, 잔재 관리, 입고 검사, 알림 시스템.

---

## 3. Phase A — 핵심 CRUD 완성

### A-1. 자재 수정/삭제 (인라인 편집 모드)
- **파일**: `app/materials/items/[id]/page.tsx`
- **범위**:
  - 상세 페이지 기본정보 영역에 `편집` 버튼 추가
  - 클릭 시 인라인 편집 모드 전환 (거래처 상세의 기존 패턴 재사용)
  - `updateMaterial` 액션 추가 (`lib/store.ts`)
  - `삭제` 버튼 + confirm 다이얼로그 (기존 `deleteMaterial` 액션 활용)
- **Store 변경**:
  ```
  updateMaterial(id, data) → materials 배열 해당 항목 업데이트
  ```
- **예상 작업량**: 소

### A-2. 발주 상세 페이지 보완
- **파일**: `app/materials/purchase-orders/[id]/page.tsx`
- **현재 상태**: 페이지 존재하나 PRD 미체크 — 상태변경 액션 보완 필요
- **범위**:
  - 발주 상태 변경 버튼 (DRAFT→ORDERED, ORDERED→CANCELLED)
  - 발주 수정 기능 (DRAFT 상태일 때만)
  - 품목 테이블에 입고수량/잔량 컬럼 확인
  - 입고이력 섹션 (해당 PO의 stockMovements 표시)
  - `입고 처리` 버튼 → `/materials/receiving/new?po={id}` 링크
- **Store 변경**:
  ```
  updatePurchaseOrder(id, data) → PO 정보 업데이트
  ```
- **예상 작업량**: 중

### A-3. 거래처 수정/삭제 보완
- **파일**: `app/materials/suppliers/[id]/page.tsx`
- **현재 상태**: 인라인 편집(updateSupplier)과 삭제(deleteSupplier) 이미 구현됨
- **범위**: PRD 체크박스 업데이트만 필요
- **예상 작업량**: 없음 (문서만)

---

## 4. Phase B — 재고 트랜잭션

### B-1. 출고 처리 (프로젝트별 자재 출고)
- **신규 파일**: `app/materials/inventory/stock-out/page.tsx`
- **범위**:
  - 프로젝트 선택 → 자재 선택 → 출고 수량 입력
  - 출고 시 재고 차감 (stocks.quantity 감소)
  - StockMovement(type: 'OUT') 생성, project_id 연결
  - 프로젝트 원가에 자재비 귀속 (stock의 avg_unit_price 기준)
- **Store 변경**:
  ```
  stockOut(material_id, quantity, project_id, reason?)
    → stocks 수량 차감
    → stockMovements에 OUT 기록 추가
  ```
- **UI 구조**:
  ```
  PageHeader: "자재 출고"
  ├─ 프로젝트 선택 드롭다운
  ├─ 자재 검색/선택 (현재 재고 표시)
  ├─ 출고 수량 입력 (재고 초과 방지 검증)
  ├─ 사유 입력 (선택)
  └─ 출고 처리 버튼
  ```
- **검증 규칙**:
  - 출고 수량 ≤ 현재 재고 수량
  - 프로젝트 필수 선택
- **예상 작업량**: 중

### B-2. 재고 조정 처리
- **신규 파일**: `app/materials/inventory/adjust/page.tsx`
- **범위**:
  - 자재 선택 → 조정 수량(+/-) 입력 → 사유 입력
  - StockMovement(type: 'ADJUST') 생성
  - stocks 수량 직접 증감
- **Store 변경**:
  ```
  adjustStock(material_id, quantity, reason)
    → stocks 수량 조정
    → stockMovements에 ADJUST 기록 추가
  ```
- **예상 작업량**: 소

### B-3. 재고 현황 페이지 개선
- **파일**: `app/materials/inventory/page.tsx`
- **범위**:
  - 헤더에 `출고` / `조정` 버튼 추가 (B-1, B-2 링크)
  - 안전재고 미달 품목 하이라이트 강화 (빨간 배경)
  - 자재별 클릭 시 상세 페이지로 이동
- **예상 작업량**: 소

### B-4. 재고 실사 기능
- **신규 파일**: `app/materials/inventory/stocktake/page.tsx`
- **범위**:
  - 전체 자재 목록 + 시스템 재고 표시
  - 실사 수량 입력 컬럼
  - 차이 자동 계산 (실사 - 시스템)
  - 일괄 조정 처리 (차이가 있는 항목만 ADJUST 생성)
- **Store 변경**:
  ```
  bulkAdjustStock(adjustments: {material_id, actual_qty}[])
    → 각 자재별 차이 계산 후 adjustStock 호출
  ```
- **예상 작업량**: 중

---

## 5. Phase C — 구매 워크플로우

### C-1. 구매 요청 등록/관리
- **신규 타입**: `types/index.ts`
  ```typescript
  export type PurchaseRequestStatus = 'REQUESTED' | 'APPROVED' | 'ORDERED' | 'REJECTED';

  export interface PurchaseRequest {
    id: string;
    request_no: string;           // PR-2026-001
    project_id?: string;          // BOM 기반일 경우
    requester_id?: string;
    material_id: string;
    quantity: number;
    required_date?: string;
    reason?: string;
    status: PurchaseRequestStatus;
    purchase_order_id?: string;   // 발주 연결
    created_at: string;
    updated_at: string;
  }
  ```
- **신규 파일**:
  - `app/materials/purchase-requests/page.tsx` — 구매 요청 목록
  - `app/materials/purchase-requests/new/page.tsx` — 구매 요청 등록
- **사이드바**: `/materials` children에 `{ name: '구매 요청', href: '/materials/purchase-requests' }` 추가
- **UI 구조** (목록):
  ```
  PageHeader: "구매 요청"
  ├─ KPI 카드 3종 (요청건수, 승인대기, 발주완료)
  ├─ 상태별 필터 탭
  └─ DataTable (요청번호, 자재, 수량, 요청일, 필요일, 상태, 액션)
  ```
- **비즈니스 로직**:
  - 요청 → 승인 → 발주 전환 워크플로우
  - 승인된 요청을 선택하여 일괄 발주 생성 가능
- **예상 작업량**: 대

### C-2. 구매 요청 → 발주 전환
- **파일**: `app/materials/purchase-requests/page.tsx` 또는 별도 액션
- **범위**:
  - 승인된 요청 다건 선택 → "발주 생성" 버튼
  - 공급처별 그룹핑하여 PO 자동 생성
  - 요청 상태 ORDERED로 변경, purchase_order_id 연결
- **Store 변경**:
  ```
  convertRequestsToPO(requestIds: string[])
    → 공급처별 그룹핑
    → addPurchaseOrder 호출
    → 요청 상태 업데이트
  ```
- **예상 작업량**: 중

### C-3. BOM 기반 구매 요청 자동 생성
- **전제조건**: BOM 관리 모듈 구현 (PRD 3.3.3) 필요
- **범위**:
  - BOM 확정(DESIGN_BOM 공정 완료) 시 트리거
  - BOM 항목의 material_id + quantity 기반
  - 현재 재고 차감 후 부족분만 구매 요청 생성
- **Store 변경**:
  ```
  generatePurchaseRequestsFromBOM(project_id)
    → BOM items 조회
    → 각 material의 현재 재고 확인
    → 부족분 계산하여 PurchaseRequest 자동 생성
  ```
- **의존성**: BOM 관리 모듈 (Phase 별도)
- **예상 작업량**: 중 (BOM 모듈 제외)

### C-4. 발주서 PDF 출력
- **범위**:
  - 발주 상세 페이지에서 "인쇄/PDF" 버튼
  - 브라우저 print 또는 react-pdf 활용
  - 발주 기본정보 + 품목 테이블 + 합계 + 공급처 정보
- **예상 작업량**: 중

---

## 6. Phase D — 자재/구매 통계

### D-1. 통계 페이지 신규 생성
- **신규 파일**: `app/materials/statistics/page.tsx`
- **사이드바**: `/materials` children에 `{ name: '자재 통계', href: '/materials/statistics' }` 추가

### D-2. 자재 소비 추이
- **차트**: 월별 BarChart (최근 6개월)
- **데이터**: `stockMovements` type='OUT' 기준 월별 그룹핑
- **필터**: 자재 카테고리별, 개별 품목별
- **X축**: 월, **Y축**: 출고 수량/금액
- **예상 작업량**: 중

### D-3. 구매 금액 추이
- **차트**: 월별 BarChart (공급업체별 색상 구분) + PieChart (카테고리별 비중)
- **데이터**: `purchaseOrders` + `items` 기준 월별/공급처별/카테고리별 그룹핑
- **뷰**: 공급업체별 탭 / 자재 카테고리별 탭
- **예상 작업량**: 중

### D-4. 재고 회전율 분석
- **차트**: 가로 BarChart (품목별 회전율 순위)
- **계산**:
  ```
  재고 회전율 = 일정 기간 출고 금액 / 평균 재고 금액
  장기 체류 = 마지막 출고 후 경과일 > 90일
  ```
- **데이터**: `stockMovements` + `stocks` 기반
- **하이라이트**: 회전율 낮은 품목(장기 체류) 경고 표시
- **예상 작업량**: 중

### D-5. 공급업체 납기 준수율
- **차트**: 가로 BarChart (업체별 준수율 %)
- **계산**:
  ```
  납기 준수 = 입고완료일 ≤ PO.due_date
  준수율 = 준수 건수 / 전체 입고 건수 × 100
  ```
- **데이터**: `purchaseOrders`(status=RECEIVED) + `stockMovements`(type=IN) 기반
- **테이블**: 업체별 총 발주/준수/지연 건수 + 평균 지연일수
- **예상 작업량**: 중

### D-6. 통계 페이지 전체 레이아웃
```
PageHeader: "자재/구매 통계"
├─ KPI 카드 4종 (이번달 구매액, 재고총액, 평균회전율, 전체납기준수율)
│
├─ 차트 영역 (grid-cols-2)
│  ├─ 자재 소비 추이 (D-2)
│  └─ 구매 금액 추이 (D-3)
│
├─ 차트 영역 (grid-cols-2)
│  ├─ 재고 회전율 TOP/BOTTOM (D-4)
│  └─ 공급업체 납기 준수율 (D-5)
│
└─ 장기 체류 재고 경고 테이블
    자재코드, 품명, 현재재고, 마지막출고일, 경과일, 재고금액
```

---

## 7. Phase E — 고도화

### E-1. 자재 분류 체계 (대/중/소분류)
- **현재**: MaterialCategory 4종 (STEEL, STANDARD_PART, CONSUMABLE, PURCHASED)
- **목표**: 대분류(현행) > 중분류 > 소분류 3단계 트리
- **변경 범위**:
  - `types/index.ts`: Material 인터페이스에 `sub_category`, `sub_sub_category` 추가
  - 또는 별도 `MaterialCategory` 테이블 (id, parent_id, name, level) 설계
  - 자재 등록 폼: 대분류 선택 → 중분류 연동 → 소분류 연동
  - 자재 목록: 분류별 그룹 필터 추가
- **DB 스키마 추가**:
  ```sql
  CREATE TABLE material_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES material_categories(id),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    level INT NOT NULL CHECK (level IN (1, 2, 3)),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```
- **예상 작업량**: 대

### E-2. 안전 재고 알림
- **범위**:
  - `stocks.quantity < materials.safety_stock` 감지
  - 대시보드 알림 카드 (안전재고 미달 품목 수)
  - 재고 현황 페이지에서 미달 품목 상단 고정 + 빨간 경고
  - 향후 Supabase Realtime 연동 시 실시간 알림 푸시
- **구현 방식** (Zustand 단계):
  - 대시보드 KPI에 "안전재고 미달" 카드 추가
  - `/materials/inventory` 페이지 상단 경고 배너
- **예상 작업량**: 소

### E-3. 잔재(端材) 관리
- **범위**:
  - 강재 가공 후 남은 자투리 등록
  - 별도 잔재 재고 관리 (크기, 무게, 원래 자재 참조)
  - 프로젝트 출고 시 잔재 우선 사용 옵션
  - 잔재 사용 시 원가 차감 처리
- **신규 타입**:
  ```typescript
  export interface RemnantMaterial {
    id: string;
    original_material_id: string;
    project_id?: string;          // 발생 프로젝트
    dimensions?: string;          // 크기 (예: 200x150x50mm)
    weight?: number;              // 무게 (kg)
    location_code?: string;
    is_available: boolean;
    used_project_id?: string;     // 사용된 프로젝트
    created_at: string;
    updated_at: string;
  }
  ```
- **예상 작업량**: 대

### E-4. 입고 검사 연동
- **전제조건**: 품질 관리 모듈 (PRD 3.6.1)
- **범위**:
  - 입고 시 자동으로 QualityInspection(type: 'INCOMING') 생성
  - 검사 합격 전 재고 미반영 (검사 대기 상태)
  - 합격 시 재고 확정, 불합격 시 반품 처리
- **의존성**: 품질 관리 모듈
- **예상 작업량**: 중

---

## 8. 구현 우선순위 로드맵

```
Phase A (즉시, ~2일)
├─ A-1. 자재 수정/삭제 인라인 편집
├─ A-2. 발주 상세 보완 (상태변경+수정)
└─ A-3. PRD 거래처 체크 업데이트

Phase B (단기, ~3일)
├─ B-1. 출고 처리 (프로젝트 연결)
├─ B-2. 재고 조정 처리
├─ B-3. 재고 현황 개선
└─ B-4. 재고 실사

Phase C (중기, ~5일)
├─ C-1. 구매 요청 등록/관리
├─ C-2. 요청 → 발주 전환
├─ C-3. BOM 기반 자동 요청 (BOM 모듈 의존)
└─ C-4. 발주서 PDF 출력

Phase D (중기, ~3일)
├─ D-1~6. 자재/구매 통계 페이지
└─ 차트 4종 + KPI + 경고 테이블

Phase E (장기, 개별)
├─ E-1. 자재 분류 체계
├─ E-2. 안전 재고 알림
├─ E-3. 잔재 관리
└─ E-4. 입고 검사 연동
```

---

## 9. Store 액션 변경 요약

### 신규 액션

| 액션명 | Phase | 설명 |
|--------|-------|------|
| `updateMaterial(id, data)` | A | 자재 마스터 수정 |
| `updatePurchaseOrder(id, data)` | A | 발주 수정 (DRAFT만) |
| `stockOut(material_id, qty, project_id, reason?)` | B | 프로젝트 자재 출고 |
| `adjustStock(material_id, qty, reason)` | B | 재고 조정 |
| `bulkAdjustStock(adjustments[])` | B | 일괄 재고 조정 (실사) |
| `addPurchaseRequest(data)` | C | 구매 요청 등록 |
| `approvePurchaseRequest(id)` | C | 구매 요청 승인 |
| `convertRequestsToPO(ids[])` | C | 요청 → 발주 전환 |
| `generatePurchaseRequestsFromBOM(project_id)` | C | BOM 기반 요청 자동 생성 |

### 기존 액션 확인

| 액션명 | 상태 | 비고 |
|--------|------|------|
| `addMaterial` | 구현됨 | |
| `deleteMaterial` | 구현됨 | 관련 stocks, materialPrices 함께 삭제 |
| `addSupplier` | 구현됨 | |
| `updateSupplier` | 구현됨 | |
| `deleteSupplier` | 구현됨 | |
| `addPurchaseOrder` | 구현됨 | |
| `deletePurchaseOrder` | 구현됨 | |
| `receivePurchaseOrder` | 구현됨 | 재고+이동평균+PO상태+단가이력 자동 |

---

## 10. 신규 라우트 요약

| 라우트 | Phase | 설명 |
|--------|-------|------|
| `/materials/inventory/stock-out` | B | 자재 출고 |
| `/materials/inventory/adjust` | B | 재고 조정 |
| `/materials/inventory/stocktake` | B | 재고 실사 |
| `/materials/purchase-requests` | C | 구매 요청 목록 |
| `/materials/purchase-requests/new` | C | 구매 요청 등록 |
| `/materials/statistics` | D | 자재/구매 통계 |

---

## 11. 타입 추가 요약

| 타입 | Phase | 파일 |
|------|-------|------|
| `PurchaseRequestStatus` | C | `types/index.ts` |
| `PurchaseRequest` | C | `types/index.ts` |
| `PR_STATUS_MAP` | C | `types/index.ts` |
| `RemnantMaterial` | E | `types/index.ts` |
| `MaterialCategoryTree` (미정) | E | `types/index.ts` |

---

## 12. 사이드바 메뉴 최종 구조

```typescript
{
  name: '자재/구매',
  href: '/materials',
  icon: Package,
  children: [
    { name: '재고 현황', href: '/materials/inventory' },
    { name: '자재 마스터', href: '/materials/items' },
    { name: '거래처 관리', href: '/materials/suppliers' },
    { name: '구매 요청', href: '/materials/purchase-requests' },   // Phase C 추가
    { name: '발주 관리', href: '/materials/purchase-orders' },
    { name: '입고 관리', href: '/materials/receiving' },
    { name: '자재 통계', href: '/materials/statistics' },          // Phase D 추가
  ],
}
```

---

## 13. 모듈 간 연계 (Cross-Module Dependencies)

```
BOM 관리 (3.3.3)
  └─ BOM 확정 → 구매 요청 자동 생성 (C-3)
      └─ 구매 요청 승인 → 발주 생성 (C-2)
          └─ 입고 처리 (구현 완료)
              ├─ 재고 증가 + 이동평균 (구현 완료)
              ├─ 단가 이력 자동 생성 (구현 완료)
              └─ 입고 검사 연동 (E-4, 품질 모듈 의존)

프로젝트/생산 (3.4)
  └─ 프로젝트 자재 출고 (B-1)
      └─ 프로젝트 원가 귀속 (자재비)
          └─ 원가 분석 (3.8)

공급업체 (3.5.4)
  └─ 발주/입고 데이터 축적
      └─ 납기 준수율 분석 (D-5)
      └─ 단가 비교/이력 (구현 완료)
```

---

## 14. 검증 기준 (Acceptance Criteria)

### Phase A
- [ ] 자재 상세에서 기본정보 인라인 편집 후 저장 가능
- [ ] 자재 삭제 시 confirm 후 목록으로 이동
- [ ] 발주 상세에서 DRAFT→ORDERED 상태 변경 가능
- [ ] 발주 상세에서 DRAFT 상태 시 품목 수정 가능
- [ ] `npx next build` 성공

### Phase B
- [ ] 자재 출고 시 재고 차감 + StockMovement(OUT) 생성
- [ ] 출고 수량 > 재고 수량 시 에러 표시
- [ ] 재고 조정 시 StockMovement(ADJUST) 생성
- [ ] 재고 실사 시 차이 품목만 일괄 조정 처리
- [ ] 재고 현황에서 출고/조정 버튼 접근 가능
- [ ] `npx next build` 성공

### Phase C
- [ ] 구매 요청 등록 → 목록에 표시
- [ ] 구매 요청 승인 → 발주 생성 전환 가능
- [ ] 다건 요청 선택 → 공급처별 PO 일괄 생성
- [ ] `npx next build` 성공

### Phase D
- [ ] 4종 차트 정상 렌더링 (소비추이, 구매추이, 회전율, 납기준수율)
- [ ] KPI 카드 수치 정확성
- [ ] 장기 체류 재고 경고 테이블 표시
- [ ] `npx next build` 성공
