# 9. API 설계 원칙

### 9.1 데이터 접근 패턴

Supabase를 사용하므로 두 가지 데이터 접근 방식을 혼용한다:

| 방식 | 사용 시점 | 예시 |
|------|----------|------|
| **Supabase Client 직접 호출** | 단순 CRUD, 실시간 구독 | 목록 조회, 상세 조회, 상태 변경 |
| **Next.js Route Handlers** | 비즈니스 로직이 복잡한 작업 | 번호 채번, 원가 집계, 상태 전이 검증, PDF 생성 |

```typescript
// 클라이언트 직접 호출 예시 (단순 CRUD)
const { data, error } = await supabase
  .from('projects')
  .select('*, customer:customers(*), manager:profiles(*)')
  .eq('status', 'DESIGNING')
  .order('due_date', { ascending: true });

// Realtime 구독 예시 (작업 현황 실시간)
supabase
  .channel('work-orders')
  .on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'work_orders' },
    (payload) => handleWorkOrderUpdate(payload)
  )
  .subscribe();
```

### 9.2 Route Handlers (비즈니스 로직)

복잡한 트랜잭션이나 다중 테이블 작업은 Route Handler + Supabase Admin Client로 처리:

```
# 영업 (트랜잭션 필요)
POST   /api/sales/quotes/:id/accept   # 견적 수락 → 수주+프로젝트 자동 생성
POST   /api/sales/orders/:id/create-project  # 수주 → 프로젝트+공정계획 일괄 생성

# 생산 (상태 전이 검증)
POST   /api/production/work-orders/:id/start    # 작업 시작 (선행 공정 완료 검증)
POST   /api/production/work-orders/:id/complete  # 작업 완료 (후속 공정 활성화, 프로젝트 상태 자동 전환)

# 자재 (재고 트랜잭션)
POST   /api/materials/stock-in     # 입고 (재고 증가 + 이동평균 단가 재계산)
POST   /api/materials/stock-out    # 출고 (재고 차감 + 프로젝트 원가 귀속)
PATCH  /api/materials/items/:id/accounting-mapping  # 품목 회계처리항목/계정 매핑 수정

# 원가/리포트
GET    /api/cost/projects/:id      # 프로젝트 원가 집계 (다중 테이블 조인)

# 번호 채번
POST   /api/system/generate-no     # 채번 (QT, SO, PJ, WO 등)

# 대시보드 (집계 쿼리)
GET    /api/dashboard/summary      # 경영 요약 (Supabase RPC 함수 호출)
GET    /api/dashboard/production   # 생산 현황

# 회계 (자동분개/원장)
POST   /api/accounting/events/post         # 도메인 이벤트 수신 후 자동 분개
POST   /api/accounting/events/reverse      # 역분개 생성 (취소/반려)
GET    /api/accounting/item-policies       # 회계처리항목별 기본 계정 정책
GET    /api/accounting/journals            # 전표 목록
GET    /api/accounting/journals/:id        # 전표 상세(라인 포함)
GET    /api/accounting/ledger              # 총계정원장
GET    /api/accounting/receivables/aging   # 미수금 에이징
GET    /api/accounting/payables/aging      # 미지급금 에이징
POST   /api/accounting/periods/:yyyymm/close   # 월마감
POST   /api/accounting/periods/:yyyymm/reopen  # 월 재오픈(권한 제한)
```

### 9.3 Supabase Database Functions (RPC)

복잡한 집계는 PostgreSQL 함수로 정의하고 `supabase.rpc()`로 호출:

```sql
-- 프로젝트 원가 집계 함수
CREATE OR REPLACE FUNCTION get_project_cost(p_project_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'material_cost', (SELECT COALESCE(SUM(sm.quantity * sm.unit_price), 0)
                      FROM stock_movements sm WHERE sm.project_id = p_project_id AND sm.type = 'OUT'),
    'design_labor_cost', (SELECT COALESCE(SUM(wl.duration / 60.0 * p.hourly_rate), 0)
                          FROM work_logs wl
                          JOIN work_orders wo ON wl.work_order_id = wo.id
                          JOIN process_steps ps ON wo.process_step_id = ps.id
                          JOIN profiles p ON wl.worker_id = p.id
                          WHERE wo.project_id = p_project_id AND ps.category = 'DESIGN'),
    'production_labor_cost', (SELECT COALESCE(SUM(wl.duration / 60.0 * p.hourly_rate), 0)
                              FROM work_logs wl
                              JOIN work_orders wo ON wl.work_order_id = wo.id
                              JOIN process_steps ps ON wo.process_step_id = ps.id
                              JOIN profiles p ON wl.worker_id = p.id
                              WHERE wo.project_id = p_project_id AND ps.category != 'DESIGN'),
    'outsource_cost', (SELECT COALESCE(SUM(total_price), 0)
                       FROM outsource_orders WHERE project_id = p_project_id AND status = 'INSPECTED')
  );
$$ LANGUAGE sql STABLE;
```

### 9.4 회계 자동연동 구현 원칙 (클린 아키텍처)

- Domain Layer
  - `domain/accounting/*`에 Entity/Port/UseCase를 신규 추가한다.
  - 자동분개 규칙은 `AccountingPolicy` + `PostAccountingEventUseCase`에서만 결정한다.
- Hook/UseCase 연동 방식
  - 기존 이벤트 발생 유즈케이스가 성공한 직후 `accountingEventPublisher`를 호출한다.
  - 연동 대상(1차):
    - `CreateOrderWithProjectUseCase` (판매/매출채권)
    - `CreatePurchaseOrderUseCase` (구매/매입채무)
    - `ReceivePurchaseOrderUseCase`, `ReceiveDirectStockUseCase`, `StockOutUseCase` (재고자산 이동)
    - `useWorkOrders.completeWorkOrder` 또는 프로젝트 완료 유즈케이스(재공품→제품)
    - `usePayments.updatePayment`에서 `CONFIRMED` 전환 시(수금)
  - 품목 입고 분개의 계정 결정 순서:
    - 1) `materials.purchase_debit_account_id` (품목 Override)
    - 2) `accounting_item_policies.accounting_item_type` 기본계정
    - 3) 시스템 기본 계정(원자재)
  - 대변 계정은 `purchase_orders.settlement_type` 기반으로 선택 (`CREDIT`=매입채무, `CASH`=현금/예금)
- 데이터 일관성
  - 원천 트랜잭션과 전표 생성은 동일 트랜잭션(또는 outbox + 재처리)으로 처리한다.
  - 실패 시 원천 데이터만 성공하고 전표가 누락되지 않도록 `accounting_events` 재처리 작업을 지원한다.
- 경계 규칙
  - Presentation/Store는 회계 분개 계산을 직접 수행하지 않는다.
  - 회계 모듈은 원천 모듈의 ID/스냅샷을 입력으로 받고, 역방향으로 원천 상태를 변경하지 않는다.

---

