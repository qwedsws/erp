# MoldERP

HMLV(High Mix Low Volume) 금형 제조업 ERP 시스템.

## 프로젝트 정보

- 시스템: MoldERP
- 기술 스택: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand, Recharts, Supabase
- UI 라이브러리: shadcn/ui, Base UI, lucide-react
- 아키텍처: Clean Architecture + 레이어 경계 ESLint 강제

## 시작하기

### 사전 요구사항

- Node.js 18 이상

### 설치 및 실행

```bash
npm install
npm run dev
npm run lint
npm run build
```

## 아키텍처

의존성 방향은 `Presentation → Hooks → Store/Infrastructure → Domain` 이다.
클린 아키텍처 경계를 지키기 위해 `app/**`에서 `domain/**`, `infrastructure/**` 직접 import를 금지한다.

### 레이어 구성

```text
domain/
  accounting/ admin/ materials/ procurement/ production/ projects/ quality/ sales/ shared/

infrastructure/
  repositories/in-memory/
  repositories/supabase/
  di/container.ts

store/
  accounting, admin, materials, procurement, production, projects, quality, sales slice

hooks/
  accounting, admin, design, materials, procurement, production, projects, quality, sales, shared

app/
  / (dashboard), /login, /auth/callback
  /sales, /projects, /design, /production, /materials, /quality, /accounting, /admin

components/
  ui/, common/, layout/, providers/
```

### 계층별 역할

- Domain: 엔티티, 포트 인터페이스, 서비스, 유스케이스
- Infrastructure: 포트 구현체(In-Memory/Supabase), DI 컨테이너
- Store: Zustand 캐시(비즈니스 규칙 없음)
- Hooks: UI와 도메인 워크플로우 연결
- App/Components: 페이지 렌더링, 사용자 상호작용

## 주요 기능 영역

- 영업: 고객/수주/결제/통계
- 프로젝트·설계: 프로젝트 일정, 설계 공정 관리, 업무 배정, 설계 부하 통계
- 생산: 작업지시, 현장 대시보드
- 자재·구매: 품목/재고/거래처/발주/구매요청/입고/통계
- 품질: 검사, 트라이아웃, 클레임
- 회계: 자동분개 조회, 매출채권/매입채무
- 관리자: 사용자/권한/코드/데이터 정합성 점검

## 환경 변수

`.env.local`에 아래 값을 설정하면 Supabase 저장소를 사용한다.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_key
```

값이 없으면 In-Memory 저장소로 동작한다.

## 프로젝트 구조

```text
erp/
├── app/                    # Next.js App Router 페이지/레이아웃/route handlers
├── components/             # UI 컴포넌트
├── domain/                 # 도메인 로직
├── infrastructure/         # 리포지토리 구현 + DI
├── store/                  # Zustand slices
├── hooks/                  # React bridge hooks
├── lib/                    # 공용 유틸, Supabase 쿼리 함수
├── types/                  # 타입/표시 맵
├── PRD/                    # 모듈형 PRD
├── docs/                   # 보조 설계 문서
├── plans/                  # 계획/핸드오프 문서
├── clean_architecture.md   # 아키텍처 원칙
└── overview.md             # 문서 인덱스
```

## 개발 가이드

### 새 기능 추가 순서

1. `domain/<domain>/entities.ts`, `ports.ts`, `use-cases/*` 정의
2. `infrastructure/repositories/*` 구현 추가
3. `infrastructure/di/container.ts` 연결
4. `store/<domain>-slice.ts`에 캐시 반영
5. `hooks/<domain>/useXxx.ts`로 UI 브리지 구성
6. `app/**` 페이지/컴포넌트에서 훅 사용

### 자주 쓰는 패턴

- 상태 표시: `components/common/status-badge.tsx` + `types/display.ts`
- DI: `infrastructure/di/container.ts` 싱글톤 팩토리
- 문서번호 생성: `domain/shared/types.ts`의 `generateDocumentNo()`

## 라이선스

Private
