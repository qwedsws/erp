# MoldERP

HMLV(High Mix Low Volume) 금형 제조업 ERP 시스템

## 프로젝트 정보

- **시스템**: MoldERP - 금형 제조업 전용 ERP 시스템
- **기술 스택**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand, Recharts, Supabase
- **UI 라이브러리**: shadcn/ui (base-lyra style, Base UI 기반), lucide-react icons
- **아키텍처**: Clean Architecture (계층 분리, ESLint 규칙 적용)

## 시작하기

### 사전 요구사항

- Node.js 18 이상

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:3000)
npm run dev

# 프로덕션 빌드
npm run build

# 린트 검사
npm run lint
```

## 아키텍처

Clean Architecture 기반으로 계층 분리되어 있으며, ESLint `no-restricted-imports` 규칙으로 의존성 방향을 강제합니다.

**의존성 방향**: Presentation → Hooks → Store/Infrastructure → Domain

```
domain/          → 도메인 레이어 (7개 도메인, 순수 TypeScript)
  materials/     → 자재 도메인
  procurement/   → 구매 도메인
  sales/         → 영업 도메인
  projects/      → 프로젝트 도메인
  production/    → 생산 도메인
  quality/       → 품질 도메인
  admin/         → 관리 도메인
  shared/        → 공유 타입 및 유틸리티

infrastructure/  → 인프라 레이어
  repositories/  → InMemory + Supabase 구현체
  di/            → DI 컨테이너

store/           → 상태 관리 레이어
  (7개 Zustand 슬라이스, 캐시 전용)

hooks/           → React 브리지 레이어
  (40개 도메인 훅)

app/             → 프레젠테이션 레이어
  (47개 라우트: dashboard, sales, projects, design, production, materials, quality, admin)

components/      → UI 컴포넌트
  ui/            → shadcn/ui 컴포넌트 (20개)
  common/        → 공통 컴포넌트 (6개)
  layout/        → 레이아웃 컴포넌트 (3개)

types/           → 타입 재수출 및 UI 표시 맵
lib/             → 유틸리티 (store, mock data, steel utils, supabase client)
```

### 계층별 역할

- **Domain**: 순수 비즈니스 로직, 엔티티, 유스케이스, 포트 인터페이스
- **Infrastructure**: 리포지토리 구현체, 외부 시스템 연동, DI 컨테이너
- **Store**: Zustand 기반 캐시 레이어 (비즈니스 로직 없음)
- **Hooks**: 도메인 로직과 React 컴포넌트 간 브리지
- **App/Components**: UI 표시 및 사용자 인터랙션

## 주요 기능

### 영업관리
- 고객 관리, 수주 관리, 수금 관리, 영업 통계

### 프로젝트 관리
- 프로젝트 등록 및 관리, 일정 캘린더

### 설계관리
- 공정 관리, 작업 배정, 통계 및 부하 분석

### 생산관리
- 생산 대시보드, 작업지시 관리

### 자재관리
- 자재 등록, 재고 관리, 입고 처리, 발주 관리
- 구매 요청, 공급처 관리, 자재 통계

### 품질관리
- 품질 검사, 시사출 관리, 클레임 처리

### 관리자
- 사용자 관리, 역할 관리, 코드 관리

## 환경 변수

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경 변수를 설정합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_key
```

환경 변수가 설정되지 않은 경우, 인메모리 리포지토리와 모의 데이터를 사용합니다.

## 프로젝트 구조

```
erp/
├── app/                    # Next.js 16 App Router (47개 라우트)
├── components/             # UI 컴포넌트 (ui, common, layout)
├── domain/                 # 도메인 레이어 (7개 도메인)
├── infrastructure/         # 인프라 레이어 (repositories, DI)
├── store/                  # Zustand 상태 관리 (7개 슬라이스)
├── hooks/                  # React 도메인 훅 (40개)
├── types/                  # 타입 정의 및 UI 표시 맵
├── lib/                    # 유틸리티 함수
├── docs/                   # 문서
├── plans/                  # 계획 문서
├── PRD.md                  # 제품 요구사항 문서
├── CLAUDE.md               # Claude Code 가이드
└── clean_architecture.md   # 아키텍처 가이드
```

## 개발 가이드

### 새 기능 추가 시 순서

1. `domain/shared/entities.ts`에 엔티티 정의
2. `domain/<domain>/ports.ts`에 리포지토리 인터페이스 정의
3. `domain/<domain>/use-cases/`에 유스케이스 추가
4. `infrastructure/repositories/in-memory/`에 리포지토리 구현
5. `infrastructure/di/container.ts`에 팩토리 함수 등록
6. `store/<domain>-slice.ts`에 캐시 함수 추가
7. `hooks/<domain>/`에 도메인 훅 생성
8. `app/<domain>/`에 페이지 구현

### 주요 패턴

- **StatusBadge + 표시 맵**: `components/common/status-badge.tsx` + `types/display.ts`의 `*_STATUS_MAP`
- **DI 컨테이너**: `infrastructure/di/container.ts`의 팩토리 함수 (싱글톤 패턴)
- **도메인 훅**: useERPStore 대신 도메인 훅 사용 권장 (예: useCustomers, useReceivePO)
- **문서 번호 생성**: `domain/shared/types.ts`의 `generateDocumentNo()` 사용

## 라이선스

Private
