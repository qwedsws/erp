# PRD: High Mix Low Volume 금형 제조업 ERP 시스템

## 1. 개요

### 1.1 제품 비전
High Mix Low Volume(다품종 소량) 금형 제조업체를 위한 통합 ERP 시스템. 수주부터 납품까지의 전체 프로세스를 디지털화하여 생산성, 납기 준수율, 원가 관리 능력을 극대화한다.

### 1.2 배경 및 문제 정의
HMLV 금형 제조업은 다음과 같은 고유한 특성을 가진다:

| 특성 | 설명 |
|------|------|
| **프로젝트형 생산** | 금형 1건 = 1프로젝트. 반복 양산이 아닌 개별 수주 생산 |
| **높은 제품 다양성** | 고객마다 다른 사양, 매번 새로운 설계 및 공정 |
| **긴 리드타임** | 설계 → 가공 → 조립 → 트라이아웃까지 수주~수개월 |
| **숙련 인력 의존** | 방전, 와이어커팅, 연마 등 숙련공의 판단에 의존 |
| **엄격한 품질 요구** | 마이크로미터 단위 정밀도, 트라이아웃 반복 |
| **복잡한 외주 관리** | 열처리, 도금, 특수가공 등 다수 외주 공정 |

**기존 문제점:**
- Excel/수기 기반 관리로 인한 데이터 단절 및 휴먼에러
- 프로젝트별 실 원가 파악 불가
- 공정 진행 현황의 실시간 파악 어려움
- 납기 지연의 사전 감지 불가
- 설계 변경(ECO) 이력 추적 미흡

### 1.3 목표 사용자
| 역할 | 주요 업무 |
|------|----------|
| **경영진** | 경영 대시보드, 매출/수주 현황, 수익성 분석 |
| **영업** | 견적, 수주 관리, 고객 커뮤니케이션 |
| **설계** | 금형 설계, BOM 관리, 설계 변경 관리 |
| **생산관리** | 작업 스케줄링, 공정 관리, 진행 현황 모니터링 |
| **현장작업자** | 작업 지시 확인, 실적 입력, 품질 체크 |
| **구매/외주** | 자재 발주, 외주 관리, 입고 검수 |
| **품질관리** | 검사, 트라이아웃 관리, 불량 이력 |
| **회계/관리** | 매입/매출 관리, 원가 집계, 정산 |

### 1.4 기술 스택
| 영역 | 기술 |
|------|------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **UI** | Tailwind CSS 4, shadcn/ui (Base UI) |
| **Backend** | Next.js API Routes (Route Handlers) + Supabase Client |
| **Database** | Supabase (PostgreSQL) — RLS 기반 행 수준 보안 |
| **인증** | Supabase Auth (역할 기반 접근 제어, JWT) |
| **파일 저장** | Supabase Storage (도면, 첨부파일) |
| **실시간** | Supabase Realtime (작업 현황, 알림) |
| **차트** | Recharts |
| **배포** | Vercel 또는 Self-hosted (Docker) |

---

## 2. 핵심 도메인 모델

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

## 3. 모듈별 기능 요구사항

### 3.1 대시보드 (Dashboard)

**경영 대시보드**
- [ ] 월별/분기별 매출·수주 추이 차트
- [ ] 프로젝트 상태별 현황 (파이프라인 뷰)
- [ ] 납기 준수율 KPI
- [ ] 가동률 현황 (설비별/인력별)
- [ ] 원가율 추이 (목표 vs 실적)
- [ ] 지연 프로젝트 알림 리스트

**현장 대시보드 (공장 모니터 전용)**
- [ ] 오늘의 작업 현황 (칸반 보드)
- [ ] 설비별 가동 상태
- [ ] 긴급 작업 지시 알림

---

### 3.2 영업 관리 (Sales)

#### 3.2.1 견적 관리 (Quotation)
- [ ] 견적 등록 (고객, 금형 종류, 사양, 수량)
- [ ] 견적 원가 산출 보조
  - 자재비: 강재 종류·중량 기반 자동 계산
  - 가공비: 공정별 시간 × 단가 기반 산출
  - 외주비: 과거 실적 기반 추정
  - 관리비·이익률 설정
- [ ] 견적서 PDF 생성 및 이메일 발송
- [ ] 견적 이력 관리 (버전 관리)
- [ ] 견적 → 수주 전환

#### 3.2.2 수주 관리 (Order)
- [ ] 수주 등록 (견적 기반 또는 직접 등록)
- [ ] 수주 확인서 생성
- [ ] 납기 일정 설정
- [ ] 수주 → 프로젝트 자동 생성
- [ ] 수주 현황 조회 (목록/캘린더 뷰)

#### 3.2.3 고객 관리 (Customer)
- [ ] 고객사 정보 관리 (회사명, 담당자, 연락처)
- [ ] 고객별 거래 이력 조회
- [ ] 고객별 매출 분석

---

### 3.3 설계 관리 (Engineering)

> **핵심 원칙**: 설계는 사이드바에서 **독립 메뉴(/design)**로 분리되어 설계 공정 현황, 설계자 업무 부하, BOM, ECO를 관리한다.
> 내부적으로는 공정 단계(ProcessStep)의 일부로서 작업 지시 → 실적 입력 → 원가 집계의 동일한 흐름을 따르며,
> 설계자의 투입 시간이 프로젝트 노무비에 자동 반영된다.

#### 3.3.1 프로젝트 관리
- [ ] 프로젝트 생성 (수주 기반 자동 / 수동)
- [ ] 프로젝트 기본 정보 (금형 종류, 사양, 캐비티 수, 소재 등)
- [x] 프로젝트 캘린더 (/projects/calendar — 월별 캘린더 뷰, 시작일/납기일/완료일 표시, 납기 지연 경고, 다가오는 납기 사이드바, 프로젝트 기간 바 차트)
- [ ] 프로젝트 타임라인 (간트 차트 — 설계 공정 포함)
- [ ] 프로젝트 상태 자동 전환 (공정 진행 상태 기반, §2.2 참조)
- [ ] 프로젝트별 파일 첨부 (2D/3D 도면, 사양서)

#### 3.3.2 설계 공정 관리
설계는 아래 세부 공정으로 구성되며, 각각 작업 지시/실적 체계를 따른다:

| 설계 공정 코드 | 공정명 | 설명 |
|---------------|--------|------|
| `DESIGN_3D` | 3D 모델링 | 금형 3D 설계 (CAD) |
| `DESIGN_2D` | 2D 도면 작성 | 가공용 2D 도면 출도 |
| `DESIGN_REVIEW` | 설계 검토 | 설계 검증 및 승인 |
| `DESIGN_BOM` | BOM 확정 | 자재 명세 확정 및 구매 연결 |

- [ ] 설계 공정에 대한 작업 지시 생성 (설계자 배정, 예상 소요일)
- [x] 설계 공정 관리 (/design/manage — 프로젝트 그리드 카드 + 모달 방식으로 프로젝트별 설계 공정 추가/삭제, KPI 요약, 검색/필터, 진행률 표시)
- [x] 설계 업무 배정 관리 (/design/assignments 전용 페이지에서 설계자 배정/재배정, 일괄 배정, 미배정 현황)
- [ ] 설계 작업 실적 입력 (투입 시간, 진행률, 산출물)
- [ ] 설계 산출물 관리 (3D 파일, 2D 도면을 공정 단계에 첨부)
- [ ] 설계 검토(Design Review) 승인 워크플로우
- [ ] 설계 완료 시 후속 공정(자재 준비, 가공) 자동 활성화
- [x] 설계 통계 (/design/workload — 공정 상태/유형 분포 차트, 설계자별 공정·시간 비교 차트, 프로젝트별 진행률 테이블, 설계자별 상세 카드)

#### 3.3.3 BOM 관리
- [ ] 금형 BOM 등록/수정
  - 금형 본체 (CORE, CAVITY, 베이스 등)
  - 표준부품 (이젝터 핀, 가이드 핀, 스프링 등)
  - 구매품 (핫러너, 유압 실린더 등)
- [ ] BOM 트리 뷰 / 플랫 뷰 전환
- [ ] BOM 기반 자재 소요량 자동 산출
- [ ] BOM 버전 관리
- [ ] BOM 확정(DESIGN_BOM 공정 완료) 시 구매 요청 자동 생성 트리거

#### 3.3.4 설계 변경 관리 (ECO)
- [ ] 설계 변경 요청 (ECR) 등록
- [ ] 설계 변경 지시 (ECO) 승인 워크플로우
- [ ] 변경 영향 분석 (BOM, 공정, 원가 영향)
- [ ] ECO 승인 시 영향받는 공정 단계 자동 재생성/수정
- [ ] 변경 이력 추적

---

### 3.4 생산 관리 (Production)

#### 3.4.1 공정 계획
- [ ] 프로젝트별 공정 계획 수립 (**설계 공정 포함**)
- [ ] 표준 공정 템플릿 관리 (설계부터 트라이아웃까지 전 공정)
  - 사출금형: **3D설계 → 2D도면 → 설계검토 → BOM확정** → 강재입고 → 황삭 → MCT → 방전 → 와이어 → 연마 → 조립 → T/O
  - 프레스금형: **3D설계 → 2D도면 → 설계검토 → BOM확정** → 강재입고 → MCT → 와이어 → 연마 → 조립 → T/O
- [ ] 공정별 예상 소요시간 설정 (설계 공정 포함)
- [ ] 공정 간 선후행 관계 설정
  - 설계 공정 내부: 3D → 2D → 검토 → BOM확정 (순차)
  - 설계 → 가공 경계: BOM확정 완료 → 자재 준비/강재입고 시작
  - 일부 가공 공정은 병렬 진행 가능 (방전 ∥ 와이어)
- [ ] 공정 계획 → 작업 지시 일괄 생성 (설계 작업 지시 포함)

#### 3.4.2 작업 지시 / 실적 관리
- [ ] 작업 지시서 생성 (공정, 설비/담당자, 작업자, 시작/종료 예정일)
  - **설계 작업 지시**: 설비 대신 설계자(담당자) 배정, 산출물 유형 지정
  - **가공 작업 지시**: 설비 + 작업자 배정, 가공 조건 기록
- [ ] 작업 지시서 출력 (바코드/QR 포함)
- [ ] 작업 시작/종료 실적 입력 (설계: 웹 입력 / 현장: 터치/스캔)
- [ ] 작업 실적: 소요시간, 가공 조건(또는 설계 산출물), 특이사항 기록
- [ ] 작업 진행 상태 실시간 업데이트

#### 3.4.3 스케줄링
- [ ] 설비별 일정 관리 (간트 차트)
- [ ] **설계자별 일정 관리** (설계 업무 간트 차트)
- [ ] 드래그 앤 드롭 스케줄 조정 (설계/가공 공정 모두)
- [ ] 설비 부하율 시각화
- [ ] **설계자 부하율 시각화** (담당 프로젝트 수, 투입 시간)
- [ ] 납기 역산 스케줄링 (납기일 기준 역방향 — 설계 소요일 포함)
- [ ] 병목 공정 자동 감지 및 알림 (설계 지연 포함)
- [ ] 작업자별 일정 뷰

#### 3.4.4 외주 관리
- [ ] 외주 공정 정의 (열처리, 도금, 코팅, 특수가공 등)
- [ ] 외주 요청 → 발주 → 출고 → 입고 워크플로우
- [ ] 외주처 관리 (업체 정보, 단가, 리드타임, 품질 이력)
- [ ] 외주 일정 추적 (예정일 vs 실 입고일)
- [ ] 외주비 관리

---

### 3.5 자재/구매 관리 (Material & Procurement)

#### 3.5.1 자재 관리
- [x] 자재 마스터 관리 (/materials/items — 품목 목록, 검색/정렬, DataTable)
- [x] 자재 등록 (/materials/items/new — 자재코드/분류/단위/규격/단가/안전재고/리드타임/공급처 폼)
- [x] 자재 상세 (/materials/items/[id] — 기본정보 + 재고 사이드바 + 입출고 이력, 재고부족 경고)
- [x] 공급처별 단가 비교 (/materials/items/[id] — 공급처별 현재 단가 테이블, 최저가/최고가/평균가 KPI, 기준가 대비 변동률, 가격 분포 시각화)
- [x] 단가 변경 이력 (/materials/items/[id] — 타임라인 형태 단가 변경 이력, 공급처별 필터, 변동률 뱃지, 이전 가격 취소선, 입고 시 자동 이력 생성)
- [ ] 자재 수정/삭제 (상세 페이지에서 인라인 편집 모드)
- [ ] 자재 분류 체계 (대/중/소분류)
- [ ] 안전 재고 설정 및 알림

#### 3.5.2 재고 관리
- [x] 현 재고 현황 조회 (/materials/inventory — KPI 카드 3종 + DataTable, 재고부족 경고)
- [ ] 입고/출고/조정 처리
- [ ] 프로젝트별 자재 출고 (원가 연결)
- [ ] 재고 실사 기능
- [ ] 잔재(端材) 관리 (강재 자투리 재활용)

#### 3.5.3 구매 관리
- [x] 발주 목록 (/materials/purchase-orders — 상태별 필터 탭 + 검색 + 테이블)
- [x] 발주 등록 (/materials/purchase-orders/new — 공급처/발주일/납기일 + 품목 라인 동적 추가/삭제 + 합계 자동계산)
- [ ] 발주 상세 (/materials/purchase-orders/[id] — 기본정보 + 품목테이블(입고수량/잔량) + 입고이력 + 상태변경 액션)
- [ ] BOM 기반 구매 요청 자동 생성
- [ ] 구매 요청 → 발주 워크플로우
- [ ] 구매 단가 이력 관리

#### 3.5.4 거래처 관리 (신규)
- [x] 거래처 목록 (/materials/suppliers — KPI 카드 3종 + DataTable, 업체명/사업자번호 검색)
- [x] 거래처 등록 (/materials/suppliers/new — 업체명/사업자번호/유형/담당자/연락처/이메일/주소/비고 폼)
- [x] 거래처 상세 (/materials/suppliers/[id] — 기본정보 + 발주이력 테이블 + 공급품목 리스트 + 거래통계)
- [x] 거래처 수정/삭제 (상세 페이지 인라인 편집 + 삭제)

#### 3.5.5 입고 관리 (신규)
- [x] 입고 관리 통합 대시보드 (/materials/receiving — 미입고 현황 + 입고 이력 탭 통합)
  - KPI 카드 4종: 이번달 입고건수, 이번달 입고금액, 미입고 발주(납기초과 카운트), 미입고 금액
  - **미입고 현황 탭**: 발주별 아코디언 UI (납기임박 순 정렬)
    - 발주번호 + 거래처 + 상태배지 + 납기초과 경고
    - 납기일 (D-day 카운트다운: N일 남음/오늘 마감/N일 초과)
    - 입고 진행률 프로그레스바 (발주수량 대비 입고수량 %)
    - 미입고 금액 (잔량 × 단가)
    - 바로 입고처리 버튼 → /materials/receiving/new?po={id}
    - 펼침 시 품목별 상세 테이블 (자재코드/자재명/발주수량/입고수량/잔량/단가/미입고금액/진행률)
    - 전체 펼치기/접기 컨트롤
    - 발주번호, 거래처, 자재명 통합 검색
  - **입고 이력 탭**: 전체 입고(IN) StockMovement 테이블 (입고일/자재코드/자재명/수량/단가/금액/발주번호)
- [x] 입고 등록 (/materials/receiving/new — 발주기반 입고(PO 선택→품목 자동로드→입고수량 입력) + 직접 입고 탭)
- [x] 입고 시 재고 자동 증가 + 이동평균 단가 재계산
- [x] 입고 시 발주 상태 자동 변경 (ORDERED → PARTIAL_RECEIVED → RECEIVED)
- [x] 입고 시 공급처별 단가 이력 자동 생성 (MaterialPrice — 단가 변동 시 자동 기록, 입고 자동 등록 메모)

---

### 3.6 품질 관리 (Quality)

#### 3.6.1 검사 관리
- [ ] 입고 검사 (자재/외주품)
- [ ] 공정 중 검사 (CMM 측정 데이터 연동)
- [ ] 최종 검사 체크리스트
- [ ] 검사 성적서 생성

#### 3.6.2 트라이아웃 관리
- [ ] 트라이아웃 계획 등록
- [ ] 트라이아웃 결과 기록 (성형 조건, 불량 내용, 사진)
- [ ] 수정 사항 도출 → 작업 지시 연결
- [ ] 트라이아웃 차수 관리 (T1, T2, T3...)

#### 3.6.3 불량/클레임 관리
- [ ] 불량 유형 분류 (설계 불량, 가공 불량, 조립 불량)
- [ ] 원인 분석 및 대책 기록
- [ ] 고객 클레임 접수 및 처리 이력
- [ ] 불량 통계 분석

---

### 3.7 설비 관리 (Facility)

- [ ] 설비 마스터 관리 (MCT, 방전기, 와이어, 연마기, CNC 등)
- [ ] 설비 상태 관리 (가동, 비가동, 고장, 보전 중)
- [ ] 정기 보전 스케줄 관리
- [ ] 고장 이력 및 수리 기록
- [ ] 설비 가동률 통계

---

### 3.8 원가 관리 (Cost)

- [ ] 프로젝트별 원가 집계
  - **자재비**: BOM 기반 출고 자재 원가
  - **설계 노무비**: 설계 공정 작업 실적 시간 × 설계 인건비 단가
  - **가공 노무비**: 가공 공정 작업 실적 시간 × 현장 인건비 단가
  - **경비**: 설비 감가상각, 전력비 등 배부
  - **외주비**: 외주 발주 금액
- [ ] 견적 원가 vs 실 원가 비교 분석
- [ ] 원가율(원가/매출) 추이 분석
- [ ] 공정별 원가 비중 분석
- [ ] 프로젝트 손익 분석

---

### 3.9 회계/정산 (Accounting)

- [ ] 매출 관리 (수주 기반 매출 인식)
- [ ] 매입 관리 (자재 구매, 외주비)
- [ ] 세금계산서 연동 (발행/수취)
- [ ] 미수금/미지급금 관리
- [ ] 월마감 처리

---

### 3.10 시스템 관리 (Admin)

- [ ] 사용자 관리 (직원 등록, 역할 배정)
- [ ] 역할 기반 접근 제어 (RBAC)
  - 관리자, 영업, 설계, 생산관리, 현장, 구매, 품질, 회계
- [ ] 공통 코드 관리 (금형 종류, 공정 코드, 불량 유형 등)
- [ ] 알림 설정 (이메일, 인앱)
- [ ] 감사 로그 (주요 데이터 변경 이력)
- [ ] 데이터 백업/복원

---

### 3.11 통계/분석 (Statistics & Analytics)

> 각 모듈의 데이터를 종합하여 경영 의사결정에 필요한 통계 분석 기능을 제공한다.
> 기간별 필터(일/주/월/분기/연도/사용자 지정)를 공통으로 지원한다.

#### 3.11.1 영업 통계
- [ ] 매출 추이 분석 (월별/분기별/연도별 매출 차트)
- [ ] 수주 현황 통계 (수주 건수, 수주 금액 추이)
- [ ] 고객별 매출 분석 (고객별 매출 비중, 상위 고객 랭킹)
- [ ] 금형 종류별 수주 분석 (사출/프레스/다이캐스팅 비율)
- [ ] 수주-납품 리드타임 분석 (평균 리드타임, 추이)
- [ ] 입금 현황 분석
  - 입금률 추이 (월별 입금 완료 비율)
  - 미수금 에이징 분석 (30일/60일/90일/90일 초과)
  - 입금 방법별 통계 (계좌이체/어음/수표/현금 비율)
  - 고객별 입금 현황 및 평균 회수 기간
  - 고객별 미수금 현황 분석 (고객별 수주액/입금완료액/미수금액/수금률 종합 테이블)
- [ ] 견적 전환율 분석 (견적 → 수주 전환율, 실패 사유 분석)

#### 3.11.2 생산 통계
- [ ] 납기 준수율 (기간별 납기 준수/지연 비율, 평균 지연일수)
- [ ] 공정별 소요시간 분석 (예상 vs 실적 비교, 공정별 편차)
- [ ] 작업자별 생산성 분석 (투입 시간, 완료 건수, 효율)
- [ ] 설비 가동률 분석 (설비별 가동/비가동/고장 비율, 추이)
- [ ] 설계자별 업무 부하 분석 (담당 프로젝트 수, 투입 시간)
- [ ] 외주 현황 통계 (외주 비율, 외주처별 납기 준수율, 외주비 추이)
- [ ] 병목 공정 분석 (지연 빈도 상위 공정, 대기시간 분석)

#### 3.11.3 품질 통계
- [ ] 불량률 추이 (월별 불량 발생 건수/비율)
- [ ] 불량 유형별 분석 (설계/가공/조립/자재 불량 파레토 차트)
- [ ] 트라이아웃 차수 분석 (평균 T/O 횟수, 1회 통과율)
- [ ] 검사 합격률 추이 (입고/공정/최종 검사 합격률)
- [ ] 고객 클레임 통계 (클레임 건수 추이, 유형별 분석, 처리 기간)
- [ ] 품질 비용 분석 (재작업 비용, 불량 손실 비용)

#### 3.11.4 원가 통계
- [ ] 프로젝트 수익성 분석 (견적가 vs 실 원가, 이익률 분포)
- [ ] 원가 구성 비율 분석 (자재비/노무비/경비/외주비 비중 추이)
- [ ] 금형 종류별 평균 원가율 비교
- [ ] 공정별 원가 비중 분석 (어떤 공정이 가장 비용이 큰지)
- [ ] 적자 프로젝트 분석 (적자 건 목록, 원인별 분류)

#### 3.11.5 자재/구매 통계
- [ ] 자재 소비 추이 (품목별 월별 사용량)
- [ ] 구매 금액 추이 (공급업체별, 자재 카테고리별)
- [ ] 재고 회전율 분석 (자재별 회전율, 장기 체류 재고)
- [ ] 공급업체 납기 준수율 (업체별 납기 준수 성과)

#### 3.11.6 경영 종합 통계
- [ ] 경영 요약 대시보드 (매출, 수주잔고, 미수금, 가동률, 납기 준수율 KPI)
- [ ] 월간/분기별 경영 리포트 자동 생성
- [ ] 전년 동기 대비 분석 (YoY 비교)
- [ ] 부서별 실적 요약 (영업, 생산, 품질 부서별 핵심 지표)

---

## 4. 화면 구조 (Information Architecture)

```
/                           # 메인 대시보드
├── /sales                  # 영업 관리
│   ├── /quotes             # 견적 목록
│   │   ├── /new            # 견적 등록
│   │   └── /[id]           # 견적 상세
│   ├── /orders             # 수주 목록
│   │   ├── /new            # 수주 등록
│   │   └── /[id]           # 수주 상세
│   └── /customers          # 고객 관리
│       ├── /new
│       └── /[id]
│
├── /projects               # 프로젝트(금형) 관리
│   ├── /                   # 프로젝트 목록 (칸반/목록 뷰 + 캘린더 링크)
│   ├── /calendar           # 프로젝트 캘린더 (월별 일정 뷰, 납기/시작/완료 이벤트, 기간 바 차트)
│   ├── /[id]               # 프로젝트 상세
│   │   ├── /design         # 설계 공정 현황 (산출물, 진행률)
│   │   ├── /bom            # BOM 관리
│   │   ├── /process        # 전체 공정 계획 (설계+가공+조립)
│   │   ├── /schedule       # 일정
│   │   ├── /quality        # 품질/검사
│   │   ├── /cost           # 원가
│   │   └── /files          # 도면/파일
│   └── /gantt              # 전체 프로젝트 간트 차트
│
├── /design                 # 설계 관리 (독립 메뉴)
│   ├── /processes          # 설계 공정 현황 (전체 프로젝트 설계 공정 대시보드)
│   ├── /manage             # 설계 공정 관리 (프로젝트 그리드 카드 → 모달로 공정 추가/삭제)
│   ├── /assignments        # 업무 배정 (설계자 배정/재배정, 일괄 배정)
│   ├── /workload           # 설계 통계 (공정 분포 차트, 설계자별 비교, 프로젝트 진행률)
│   ├── /bom                # BOM 관리
│   └── /changes            # 설계 변경 관리 (ECR/ECO)
│
├── /production             # 생산 관리
│   ├── /work-orders        # 작업 지시 목록 (설계+가공 통합)
│   │   └── /[id]           # 작업 지시 상세
│   ├── /schedule           # 설비 스케줄 (간트)
│   ├── /design-schedule    # 설계자 스케줄 (간트)
│   ├── /outsource          # 외주 관리
│   │   └── /[id]
│   └── /dashboard          # 현장 대시보드
│
├── /materials              # 자재/구매
│   ├── /inventory          # 재고 현황 (KPI + DataTable)
│   ├── /items              # 자재 마스터 (품목 목록)
│   │   ├── /new            # 품목 등록
│   │   └── /[id]           # 품목 상세 (기본정보 + 재고 + 입출고 이력)
│   ├── /suppliers          # 거래처 관리 (공급업체 CRUD)
│   │   ├── /new            # 거래처 등록
│   │   └── /[id]           # 거래처 상세 (발주이력 + 공급품목)
│   ├── /purchase-orders    # 발주 관리
│   │   ├── /new            # 발주 등록 (품목 라인 동적 추가)
│   │   └── /[id]           # 발주 상세 (품목 + 입고이력 + 상태변경)
│   └── /receiving          # 입고 관리
│       └── /new            # 입고 등록 (발주기반/직접 입고)
│
├── /quality                # 품질 관리
│   ├── /inspections        # 검사 관리
│   ├── /tryouts            # 트라이아웃
│   │   └── /[id]
│   └── /claims             # 클레임/불량
│
├── /facilities             # 설비 관리
│   ├── /machines           # 설비 목록
│   │   └── /[id]
│   └── /maintenance        # 보전 관리
│
├── /cost                   # 원가 분석
│   ├── /projects           # 프로젝트별 원가
│   └── /analysis           # 원가 분석 리포트
│
├── /statistics             # 통계/분석
│   ├── /sales              # 영업 통계 (매출 추이, 고객별, 입금 분석)
│   ├── /production         # 생산 통계 (납기 준수율, 가동률, 공정 분석)
│   ├── /quality            # 품질 통계 (불량률, T/O 분석, 클레임)
│   ├── /cost               # 원가 통계 (수익성, 원가율, 적자 분석)
│   ├── /materials          # 자재 통계 (소비 추이, 재고 회전율)
│   └── /executive          # 경영 종합 통계 (KPI 대시보드, 월간 리포트)
│
├── /accounting             # 회계/정산
│   ├── /sales-ledger       # 매출 관리
│   ├── /purchase-ledger    # 매입 관리
│   └── /receivables        # 미수/미지급
│
└── /admin                  # 시스템 관리
    ├── /users              # 사용자 관리
    ├── /roles              # 역할/권한 관리
    └── /codes              # 공통 코드 관리
```

---

## 5. 비기능 요구사항

### 5.1 성능
- 페이지 로드: 초기 로드 < 2초, 이후 탐색 < 500ms
- API 응답: 목록 조회 < 300ms, 단건 조회 < 100ms
- 동시 사용자: 50명 이상 지원

### 5.2 보안
- HTTPS 필수
- Supabase RLS(Row Level Security)로 행 수준 데이터 접근 제어
- 역할 기반 접근 제어 (RBAC) — `user_metadata.role` 기반 RLS 정책
- Supabase Auth JWT 기반 인증/인가
- API 레벨 권한 검증 (Next.js 미들웨어 + RLS 이중 검증)
- SQL Injection / XSS 방지

### 5.3 가용성
- 가용성 목표: 99.5% (업무 시간 기준)
- 일 1회 자동 백업
- 장애 시 4시간 내 복구

### 5.4 사용성
- 반응형 디자인 (데스크톱 우선, 태블릿 지원)
- 현장용 화면은 터치 친화적 UI
- 한국어 기본 (향후 다국어 확장 가능 구조)

### 5.5 데이터
- 감사 추적: 주요 엔티티의 생성/수정/삭제 이력 (audit_logs 테이블)
- 소프트 삭제 적용 (데이터 복구 가능)
- 파일 업로드: Supabase Storage, 단일 파일 100MB 이하
- DB 백업: Supabase 자동 백업 (Pro plan 기준 일 1회, 7일 보관)

---

## 6. 개발 우선순위 (Phase)

### Phase 1 — 핵심 기반 (MVP)
> 목표: 프로젝트 중심의 기본 업무 흐름 구축

| 모듈 | 기능 |
|------|------|
| 시스템 | 인증, RBAC, 공통 코드, 레이아웃 |
| 영업 | 고객 관리, 수주 등록 |
| 프로젝트 | 프로젝트 CRUD, 상태 관리, 파일 첨부 |
| 생산 | 공정 계획 (설계 공정 포함), 작업 지시, 실적 입력 |
| 대시보드 | 프로젝트 현황, 작업 현황 |

### Phase 2 — 확장
> 목표: 자재/구매, 외주, BOM 관리 체계화

| 모듈 | 기능 |
|------|------|
| 설계 | BOM 관리, 설계 변경(ECO) |
| 자재 | 자재 마스터, 재고 관리, 입출고 |
| 구매 | 구매 요청, 발주, 입고 검수 |
| 외주 | 외주 발주, 일정 추적, 입고 |
| 견적 | 견적 등록, 원가 산출, 견적서 생성 |

### Phase 3 — 고도화
> 목표: 품질·원가·설비 관리 및 분석 역량 강화

| 모듈 | 기능 |
|------|------|
| 품질 | 검사 관리, 트라이아웃, 불량/클레임 |
| 원가 | 프로젝트 원가 집계, 견적 vs 실적 비교 |
| 설비 | 설비 마스터, 보전 관리, 가동률 |
| 스케줄링 | 간트 차트, 부하 관리, 납기 역산 |
| 회계 | 매출/매입, 미수/미지급, 세금계산서 |
| 통계 (기본) | 영업 통계 (매출 추이, 입금 현황), 생산 통계 (납기 준수율, 가동률) |

### Phase 4 — 최적화
> 목표: 데이터 기반 의사결정 및 자동화

| 모듈 | 기능 |
|------|------|
| 대시보드 | 경영 분석 대시보드 고도화 |
| 통계 (고도화) | 품질·원가·자재 통계, 경영 종합 통계, 전년 동기 비교, 월간 리포트 자동 생성 |
| 리포트 | 각종 분석 리포트 자동 생성 (PDF 내보내기) |
| 알림 | 지연 예측 알림, 재고 부족 알림, 미수금 알림 |
| 연동 | 세금계산서 API, CAD 데이터 연동 |

---

## 7. 핵심 비즈니스 규칙

### 7.1 프로젝트 상태 전이 규칙 (공정 기반 자동 전환)
```
- 수주확정 → 설계중: 설계 공정(DESIGN_3D) 작업 시작 시 자동 전환. 설계자 배정 필수.
- 설계중 → 설계완료: 모든 설계 공정(DESIGN_3D/2D/REVIEW/BOM) 완료 시 자동 전환.
                     DESIGN_REVIEW 승인 및 BOM 확정 필수.
- 설계완료 → 자재준비: MATERIAL_PREP 공정 시작 시 자동 전환. BOM 확정 필수.
- 자재준비 → 가공중: 첫 가공 공정 작업 시작 시 자동 전환. 핵심 자재 입고 완료 필수.
- 조립중 → 트라이아웃: TRYOUT 공정 시작 시. 조립 완료 검사 통과 필수.
- 최종검사 → 출하: FINAL_INSPECTION 합격 시. 최종 검사 합격 필수.
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

---

## 8. 데이터베이스 스키마 (Supabase PostgreSQL)

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

---

## 9. API 설계 원칙

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

# 원가/리포트
GET    /api/cost/projects/:id      # 프로젝트 원가 집계 (다중 테이블 조인)

# 번호 채번
POST   /api/system/generate-no     # 채번 (QT, SO, PJ, WO 등)

# 대시보드 (집계 쿼리)
GET    /api/dashboard/summary      # 경영 요약 (Supabase RPC 함수 호출)
GET    /api/dashboard/production   # 생산 현황
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

---

## 10. UI/UX 가이드라인

### 10.1 레이아웃
```
┌─────────────────────────────────────────────────┐
│  Top Bar: 로고 | 검색 | 알림 | 사용자 메뉴       │
├────────┬────────────────────────────────────────┤
│        │                                        │
│  Side  │         Main Content Area              │
│  Nav   │                                        │
│        │  ┌──────────────────────────────────┐  │
│ 대시보드 │  │  Page Header (제목 + 액션 버튼)    │  │
│ 영업    │  ├──────────────────────────────────┤  │
│ 프로젝트│  │  필터/검색 바                       │  │
│ 생산    │  ├──────────────────────────────────┤  │
│ 자재    │  │                                  │  │
│ 품질    │  │  Content (테이블/카드/폼)          │  │
│ 설비    │  │                                  │  │
│ 원가    │  └──────────────────────────────────┘  │
│ 회계    │                                        │
│ 관리    │                                        │
├────────┴────────────────────────────────────────┤
│  Status Bar (선택)                               │
└─────────────────────────────────────────────────┘
```

### 10.2 디자인 원칙
- **정보 밀도 우선**: 한 화면에 필요한 정보를 최대한 표시 (ERP 특성)
- **일관된 패턴**: 목록 → 상세 → 편집 패턴 통일
- **컬러 코딩**: 상태별 색상 통일 (진행중=파랑, 완료=초록, 지연=빨강, 대기=회색)
- **키보드 친화적**: 주요 기능 키보드 단축키 지원
- **현장 친화적**: 작업 실적 입력 화면은 큰 버튼, 터치 최적화

### 10.3 공통 컴포넌트
- DataTable: 정렬, 필터, 페이지네이션, 컬럼 커스터마이징
- StatusBadge: 상태별 색상 배지
- Timeline: 프로젝트/작업 이력 타임라인
- FileUploader: 드래그앤드롭 파일 업로드
- NumberInput: 숫자/금액 입력 (천단위 콤마, 소수점 처리)
- DateRangePicker: 기간 선택
- GanttChart: 간트 차트 (스케줄링)
- KanbanBoard: 칸반 보드 (프로젝트 현황)

---

## 11. 번호 체계 규칙

| 구분 | 형식 | 예시 |
|------|------|------|
| 견적번호 | QT-YYYY-NNN | QT-2026-001 |
| 수주번호 | SO-YYYY-NNN | SO-2026-001 |
| 프로젝트번호 | PJ-YYYY-NNN | PJ-2026-001 |
| 작업지시번호 | WO-YYYY-NNNNN | WO-2026-00001 |
| 발주번호 | PO-YYYY-NNN | PO-2026-001 |
| 외주번호 | OS-YYYY-NNN | OS-2026-001 |
| 설계변경번호 | ECO-YYYY-NNN | ECO-2026-001 |
| 검사번호 | QI-YYYY-NNN | QI-2026-001 |

---

## 12. 용어 사전 (Glossary)

| 용어 | 영문 | 설명 |
|------|------|------|
| 금형 | Mold / Die | 제품을 성형하기 위한 도구 (사출금형, 프레스금형 등) |
| HMLV | High Mix Low Volume | 다품종 소량 생산 방식 |
| BOM | Bill of Materials | 자재 명세서 |
| ECR | Engineering Change Request | 설계 변경 요청 |
| ECO | Engineering Change Order | 설계 변경 지시 |
| MCT | Machining Center | 머시닝센터 (CNC 가공기) |
| EDM | Electrical Discharge Machining | 방전 가공 |
| Wire EDM | Wire Electrical Discharge Machining | 와이어 방전 가공 (와이어컷) |
| T/O | Tryout | 트라이아웃 (금형 시사출/시타) |
| 공정 단계 | Process Step | 프로젝트를 구성하는 개별 작업 단위. 설계·가공·조립·품질 등 모든 작업 포함 |
| 설계 공정 | Design Process | 공정 단계의 일부로서 3D모델링, 2D도면, 설계검토, BOM확정을 포함 |
| 설계 검토 | Design Review | 설계 산출물의 적합성을 검증하는 승인 공정 |
| 황삭 | Roughing | 거친 가공 (형상 대략 가공) |
| 정삭 | Finishing | 정밀 가공 (최종 치수 가공) |
| 캐비티 | Cavity | 금형에서 제품이 성형되는 공간 (암형) |
| 코어 | Core | 금형에서 제품 내부를 형성하는 부분 (수형) |
| 핫러너 | Hot Runner | 사출금형의 수지 유로를 가열하는 시스템 |
| 잔재 | Remnant Material | 가공 후 남은 자투리 자재 |
| 이동평균단가 | Moving Average Price | 입고 시마다 재계산되는 평균 단가 |

---

## 13. 아키텍처

> 상세 문서: [`clean_architecture.md`](./clean_architecture.md)

MoldERP는 **클린 아키텍처(Clean Architecture)** 원칙을 적용하여 비즈니스 로직을 UI와 인프라로부터 분리한다.

### 13.1 레이어 구조

```
Presentation (Pages/Components)
  ↓
Hooks (React 브리지)
  ↓
Store (Zustand — 얇은 캐시, 비즈니스 로직 없음)
  ↓
Infrastructure (Repository 구현체, DI Container)
  ↓
Domain (Entities, Ports, Services, Use Cases)
```

- **Domain**: 순수 TypeScript. React·Zustand·Supabase 의존성 없음. 엔티티 타입, Repository 인터페이스(Port), 비즈니스 규칙(Service), 워크플로우(Use Case) 정의.
- **Infrastructure**: Domain Port의 구현체. Mock(개발용)과 Supabase(프로덕션) 두 벌 유지. DI Container로 교체.
- **Store**: Zustand Slice로 분리. 데이터 캐시와 로딩 상태만 관리. `addOrder`, `updateProject` 등의 비즈니스 메서드 없음.
- **Hooks**: Use Case를 호출하고 Store를 구독하여 React 컴포넌트에 데이터를 제공하는 브리지.
- **Presentation**: Next.js 페이지와 컴포넌트. Hook만 사용하여 데이터 접근.

### 13.2 핵심 원칙

| 원칙 | 설명 |
|------|------|
| 의존성 역전 | Domain이 Infrastructure를 모른다. Port(인터페이스)로 소통 |
| 단일 책임 | Store=캐시, UseCase=워크플로우, Service=비즈니스 규칙 |
| 교체 가능성 | DI Container에서 Mock ↔ Supabase 한 줄 교체 |
| 점진적 마이그레이션 | 현재 모놀리식 Store와 공존하면서 모듈 단위 전환 |

---

## 14. 향후 확장 고려사항

- **모바일 앱**: 현장 작업자용 PWA 또는 네이티브 앱
- **IoT 연동**: 설비 가동 데이터 자동 수집 (OPC-UA, MTConnect)
- **AI 활용**: 납기 예측, 견적 자동 산출, 불량 패턴 분석
- **ERP 연동**: SAP, 더존 등 기존 회계 시스템 연동
- **CAD 연동**: 3D 모델 뷰어, 자동 BOM 추출
- **협력사 포털**: 외주업체용 웹 포털 (일정 확인, 납품 등록)
