# MoldERP 클린 아키텍처 가이드

## 1. 개요

MoldERP는 **클린 아키텍처(Clean Architecture)** 원칙을 적용하여 비즈니스 로직을 UI·인프라로부터 분리한다.
이를 통해 테스트 용이성, 유지보수성, 향후 백엔드(Supabase) 전환의 용이성을 확보한다.

---

## 2. 레이어 구조

```
┌──────────────────────────────────────────────────────┐
│                 Presentation Layer                    │
│         (Pages, Components, Layouts)                 │
├──────────────────────────────────────────────────────┤
│                   Hooks Layer                        │
│     (React Hooks — 도메인 로직 ↔ React 브리지)        │
├──────────────────────────────────────────────────────┤
│                Store / State Layer                   │
│       (Zustand Slices — 비즈니스 로직 없는 캐시)       │
├──────────────────────────────────────────────────────┤
│              Infrastructure Layer                    │
│    (Repository 구현체, DI Container, API 클라이언트)   │
├──────────────────────────────────────────────────────┤
│                  Domain Layer                        │
│  (Entities, Ports, Services, Use Cases, Validators)  │
└──────────────────────────────────────────────────────┘
```

**의존성 방향**: 항상 바깥 → 안쪽. 내부 레이어는 외부를 절대 참조하지 않는다.

| 레이어 | 참조 가능 | 참조 불가 |
|--------|----------|----------|
| Domain | 없음 (자기 자신만) | Infrastructure, Store, Hooks, Presentation |
| Infrastructure | Domain | Store, Hooks, Presentation |
| Store | Domain, Infrastructure | Hooks, Presentation |
| Hooks | Domain, Store, Infrastructure | Presentation |
| Presentation | Hooks, (Store 읽기 전용) | Domain 직접 참조, Infrastructure 직접 참조 |

---

## 3. 디렉토리 구조

```
src/
├── domain/                          # 도메인 레이어 (순수 TypeScript)
│   ├── entities/                    # 엔티티 타입 정의
│   │   ├── customer.ts
│   │   ├── order.ts
│   │   ├── project.ts
│   │   ├── process-step.ts
│   │   ├── work-order.ts
│   │   ├── material.ts
│   │   └── index.ts                 # 배럴 파일
│   ├── ports/                       # Repository 인터페이스 (Port)
│   │   ├── customer-repository.ts
│   │   ├── order-repository.ts
│   │   ├── project-repository.ts
│   │   └── index.ts
│   ├── services/                    # 도메인 서비스 (순수 비즈니스 규칙)
│   │   ├── project-status.service.ts
│   │   ├── cost-calculation.service.ts
│   │   ├── number-generator.service.ts
│   │   └── stock-valuation.service.ts
│   ├── use-cases/                   # 유스케이스 (비즈니스 워크플로우)
│   │   ├── create-order.use-case.ts
│   │   ├── complete-work-order.use-case.ts
│   │   ├── receive-goods.use-case.ts
│   │   └── calculate-project-cost.use-case.ts
│   └── validators/                  # 도메인 유효성 검증
│       ├── order.validator.ts
│       └── process-step.validator.ts
│
├── infrastructure/                  # 인프라스트럭처 레이어
│   ├── repositories/                # Port 구현체
│   │   ├── mock/                    # Mock 구현 (개발 단계)
│   │   │   ├── mock-customer.repository.ts
│   │   │   ├── mock-order.repository.ts
│   │   │   └── mock-project.repository.ts
│   │   └── supabase/                # Supabase 구현 (프로덕션)
│   │       ├── supabase-customer.repository.ts
│   │       ├── supabase-order.repository.ts
│   │       └── supabase-project.repository.ts
│   ├── di/                          # DI Container
│   │   └── container.ts
│   └── mappers/                     # 데이터 변환 (DB row ↔ Entity)
│       ├── customer.mapper.ts
│       └── project.mapper.ts
│
├── store/                           # Store 레이어 (Zustand — 얇은 캐시)
│   ├── slices/
│   │   ├── customer.slice.ts
│   │   ├── order.slice.ts
│   │   ├── project.slice.ts
│   │   └── ui.slice.ts             # UI 전용 상태 (사이드바, 모달 등)
│   └── index.ts                     # 스토어 결합
│
├── hooks/                           # Hooks 레이어 (React 브리지)
│   ├── use-customers.ts
│   ├── use-orders.ts
│   ├── use-projects.ts
│   ├── use-work-orders.ts
│   └── use-project-cost.ts
│
├── app/                             # Presentation 레이어 (Next.js Pages)
│   ├── page.tsx
│   ├── sales/
│   ├── projects/
│   ├── production/
│   └── materials/
│
└── components/                      # Presentation 레이어 (공통 컴포넌트)
    ├── common/
    ├── layout/
    └── features/
```

---

## 4. 패턴 상세

### 4.1 Entity (도메인 엔티티)

엔티티는 순수 TypeScript 타입으로, 외부 의존성이 없다.

```typescript
// domain/entities/project.ts
export type ProjectStatus =
  | 'CONFIRMED' | 'DESIGNING' | 'DESIGN_COMPLETE'
  | 'MATERIAL_PREP' | 'MACHINING' | 'ASSEMBLING'
  | 'TRYOUT' | 'REWORK' | 'FINAL_INSPECTION'
  | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED';

export interface Project {
  id: string;
  projectNo: string;
  orderId?: string;
  name: string;
  moldType: MoldType;
  status: ProjectStatus;
  priority: Priority;
  managerId?: string;
  startDate?: string;
  dueDate: string;
  completedDate?: string;
}
```

### 4.2 Port (Repository 인터페이스)

Port는 도메인이 정의하는 추상 인터페이스다. **구현체를 모른다.**

```typescript
// domain/ports/project-repository.ts
import { Project, ProjectStatus } from '../entities/project';

export interface ProjectRepository {
  findAll(): Promise<Project[]>;
  findById(id: string): Promise<Project | null>;
  findByStatus(status: ProjectStatus): Promise<Project[]>;
  create(project: Omit<Project, 'id'>): Promise<Project>;
  update(id: string, data: Partial<Project>): Promise<Project>;
  delete(id: string): Promise<void>;
}
```

### 4.3 Domain Service (도메인 서비스)

순수 비즈니스 규칙을 캡슐화한다. **외부 의존성 없음**, 순수 함수에 가깝다.

```typescript
// domain/services/project-status.service.ts
import { ProcessStep } from '../entities/process-step';
import { ProjectStatus } from '../entities/project';

/**
 * 공정 진행 상태에 따른 프로젝트 상태 자동 전환 규칙.
 * PRD §2.2, §7.1 참조.
 */
export function deriveProjectStatus(steps: ProcessStep[]): ProjectStatus {
  const designSteps = steps.filter(s => s.category === 'DESIGN');
  const productionSteps = steps.filter(s => s.category === 'PRODUCTION');

  // 설계 공정 중 하나라도 진행 중이면 → 설계중
  if (designSteps.some(s => s.status === 'IN_PROGRESS')) return 'DESIGNING';

  // 모든 설계 공정이 완료되면 → 설계완료
  if (designSteps.length > 0 && designSteps.every(s => s.status === 'COMPLETED')) {
    // 가공 공정 시작 여부에 따라 추가 전환
    if (productionSteps.some(s => s.status === 'IN_PROGRESS')) return 'MACHINING';
    return 'DESIGN_COMPLETE';
  }

  return 'CONFIRMED';
}
```

### 4.4 Use Case (유스케이스)

복잡한 비즈니스 워크플로우를 캡슐화한다. Port(Repository)를 주입받아 사용한다.

```typescript
// domain/use-cases/complete-work-order.use-case.ts
import { WorkOrderRepository } from '../ports/work-order-repository';
import { ProcessStepRepository } from '../ports/process-step-repository';
import { ProjectRepository } from '../ports/project-repository';
import { deriveProjectStatus } from '../services/project-status.service';

interface Dependencies {
  workOrderRepo: WorkOrderRepository;
  processStepRepo: ProcessStepRepository;
  projectRepo: ProjectRepository;
}

/**
 * 작업 완료 유스케이스:
 * 1. 작업 지시 상태를 COMPLETED로 변경
 * 2. 해당 공정 단계 상태를 COMPLETED로 변경
 * 3. 프로젝트 상태 자동 전환 규칙 적용
 */
export function createCompleteWorkOrderUseCase(deps: Dependencies) {
  return async (workOrderId: string) => {
    // 1) 작업 지시 완료 처리
    const workOrder = await deps.workOrderRepo.findById(workOrderId);
    if (!workOrder) throw new Error('작업 지시를 찾을 수 없습니다.');
    await deps.workOrderRepo.update(workOrderId, {
      status: 'COMPLETED',
      actualEnd: new Date().toISOString(),
    });

    // 2) 공정 단계 완료 처리
    if (workOrder.processStepId) {
      await deps.processStepRepo.update(workOrder.processStepId, {
        status: 'COMPLETED',
      });
    }

    // 3) 프로젝트 상태 자동 전환
    const allSteps = await deps.processStepRepo.findByProjectId(workOrder.projectId);
    const newStatus = deriveProjectStatus(allSteps);
    await deps.projectRepo.update(workOrder.projectId, { status: newStatus });
  };
}
```

### 4.5 Repository 구현체 (Infrastructure)

Port의 실제 구현. Mock과 Supabase 두 가지 버전이 공존한다.

```typescript
// infrastructure/repositories/mock/mock-project.repository.ts
import { ProjectRepository } from '@/domain/ports/project-repository';
import { Project, ProjectStatus } from '@/domain/entities/project';

export function createMockProjectRepository(
  getData: () => Project[],
  setData: (projects: Project[]) => void
): ProjectRepository {
  return {
    async findAll() {
      return getData();
    },
    async findById(id: string) {
      return getData().find(p => p.id === id) ?? null;
    },
    async findByStatus(status: ProjectStatus) {
      return getData().filter(p => p.status === status);
    },
    async create(project) {
      const newProject = { ...project, id: crypto.randomUUID() };
      setData([...getData(), newProject]);
      return newProject;
    },
    async update(id, data) {
      const projects = getData().map(p => p.id === id ? { ...p, ...data } : p);
      setData(projects);
      return projects.find(p => p.id === id)!;
    },
    async delete(id) {
      setData(getData().filter(p => p.id !== id));
    },
  };
}
```

### 4.6 DI Container (의존성 주입 컨테이너)

팩토리 함수로 구현. 환경에 따라 Mock 또는 Supabase 구현체를 주입한다.

```typescript
// infrastructure/di/container.ts
import { createMockProjectRepository } from '../repositories/mock/mock-project.repository';
import { createCompleteWorkOrderUseCase } from '@/domain/use-cases/complete-work-order.use-case';

// 현재 단계: Mock 데이터 사용
// Supabase 전환 시 이 파일만 수정하면 됨

export function createContainer(store: ERPStore) {
  // Repositories
  const projectRepo = createMockProjectRepository(
    () => store.projects,
    (projects) => store.setProjects(projects)
  );
  const workOrderRepo = createMockWorkOrderRepository(/* ... */);
  const processStepRepo = createMockProcessStepRepository(/* ... */);

  // Use Cases
  const completeWorkOrder = createCompleteWorkOrderUseCase({
    workOrderRepo,
    processStepRepo,
    projectRepo,
  });

  return {
    repositories: { projectRepo, workOrderRepo, processStepRepo },
    useCases: { completeWorkOrder },
  };
}
```

### 4.7 Store Slice (Zustand — 얇은 캐시)

스토어는 **비즈니스 로직 없이** 데이터 캐시와 로딩 상태만 관리한다.

```typescript
// store/slices/project.slice.ts
import { StateCreator } from 'zustand';
import { Project } from '@/domain/entities/project';

export interface ProjectSlice {
  projects: Project[];
  projectsLoading: boolean;
  setProjects: (projects: Project[]) => void;
  setProjectsLoading: (loading: boolean) => void;
}

export const createProjectSlice: StateCreator<ProjectSlice> = (set) => ({
  projects: [],
  projectsLoading: false,
  setProjects: (projects) => set({ projects }),
  setProjectsLoading: (loading) => set({ projectsLoading: loading }),
});
```

**핵심 원칙**: Slice에는 `addProject`, `updateProjectStatus` 같은 비즈니스 메서드가 **없다**. 데이터 쓰기는 UseCase → Repository → Store 순서로 흐른다.

### 4.8 Hook (React 브리지)

도메인 유스케이스와 React 컴포넌트를 연결하는 다리 역할.

```typescript
// hooks/use-projects.ts
import { useCallback } from 'react';
import { useStore } from '@/store';
import { useContainer } from '@/infrastructure/di/use-container';

export function useProjects() {
  const { projects, projectsLoading, setProjects, setProjectsLoading } = useStore();
  const { repositories } = useContainer();

  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const data = await repositories.projectRepo.findAll();
      setProjects(data);
    } finally {
      setProjectsLoading(false);
    }
  }, [repositories, setProjects, setProjectsLoading]);

  return { projects, loading: projectsLoading, fetchProjects };
}

export function useCompleteWorkOrder() {
  const { useCases } = useContainer();

  return useCallback(async (workOrderId: string) => {
    await useCases.completeWorkOrder(workOrderId);
    // 스토어는 Repository 내부에서 이미 업데이트됨
  }, [useCases]);
}
```

---

## 5. 데이터 흐름

### 5.1 읽기 흐름 (Query)

```
Page/Component
  → useProjects() Hook
    → repository.findAll() (Port 호출)
      → Mock: 메모리 배열 반환
      → Supabase: supabase.from('projects').select() 호출
    → setProjects() (Store 캐시 갱신)
  ← projects 데이터 반환
```

### 5.2 쓰기 흐름 (Command)

```
Page/Component: "작업 완료" 버튼 클릭
  → useCompleteWorkOrder() Hook
    → completeWorkOrder UseCase 실행
      → workOrderRepo.update()     (작업 지시 완료)
      → processStepRepo.update()   (공정 단계 완료)
      → deriveProjectStatus()      (순수 함수 — 상태 도출)
      → projectRepo.update()       (프로젝트 상태 전환)
    → Store 자동 갱신 (Repository가 Store setter 호출)
  ← UI 자동 리렌더링
```

---

## 6. 마이그레이션 가이드 (모놀리식 Store → 클린 아키텍처)

### 현재 문제

현재 `lib/store.ts`는 **900줄 이상의 모놀리식 파일**로, 다음 문제가 있다:

- 데이터 저장, 비즈니스 로직, ID 생성이 한 곳에 혼합
- `addOrder` 안에 프로젝트 자동 생성 등 복잡한 워크플로우 포함
- Mock ↔ Supabase 전환 시 전체 파일 수정 필요
- 단위 테스트가 어려움

### 마이그레이션 단계

| 단계 | 작업 | 영향 범위 |
|------|------|----------|
| **1단계** | `types/index.ts` → `domain/entities/`로 분리 | 타입 import 경로 변경 |
| **2단계** | Store에서 비즈니스 로직 추출 → `domain/services/`, `domain/use-cases/` | Store 메서드 축소 |
| **3단계** | Repository Port 정의 + Mock 구현체 작성 | 새 파일 추가 |
| **4단계** | DI Container 구성 | 새 파일 추가 |
| **5단계** | Store를 Slice로 분리 (캐시 전용) | Store 리팩토링 |
| **6단계** | Hook 작성 + Page에서 Hook 사용으로 전환 | 컴포넌트 수정 |
| **7단계** | Supabase Repository 구현체 추가 | Container에서 교체 |

### 마이그레이션 예시: `addOrder`

**현재** (`lib/store.ts`):
```typescript
// 하나의 함수에 채번 + 주문 생성 + 프로젝트 자동 생성이 혼합
addOrder: (order) => {
  const newOrder = { ...order, id: generateId(), order_no: generateNo('SO', ...) };
  // ... 프로젝트 자동 생성 로직 ...
  set({ orders: [...get().orders, newOrder], projects: [...get().projects, newProject] });
}
```

**변경 후**:
```typescript
// domain/use-cases/create-order.use-case.ts
export function createCreateOrderUseCase(deps: {
  orderRepo: OrderRepository;
  projectRepo: ProjectRepository;
  numberGenerator: NumberGeneratorService;
}) {
  return async (input: CreateOrderInput) => {
    const orderNo = deps.numberGenerator.generate('SO');
    const order = await deps.orderRepo.create({ ...input, orderNo });
    const project = await deps.projectRepo.create({
      orderId: order.id,
      name: input.title,
      // ...
    });
    return { order, project };
  };
}
```

---

## 7. 테스트 전략

클린 아키텍처의 가장 큰 이점은 **계층별 독립 테스트**가 가능하다는 점이다.

| 레이어 | 테스트 종류 | 의존성 |
|--------|-----------|--------|
| Domain Service | 단위 테스트 | 없음 (순수 함수) |
| Use Case | 단위 테스트 | Port 인터페이스 Mock |
| Repository | 통합 테스트 | Mock: 메모리 / Supabase: 테스트 DB |
| Hook | 컴포넌트 테스트 | Container Mock |
| Page | E2E 테스트 | 전체 스택 |

```typescript
// domain/services/project-status.service.test.ts
import { deriveProjectStatus } from './project-status.service';

test('설계 공정 하나라도 진행 중이면 DESIGNING', () => {
  const steps = [
    { category: 'DESIGN', status: 'IN_PROGRESS' },
    { category: 'DESIGN', status: 'PLANNED' },
  ];
  expect(deriveProjectStatus(steps)).toBe('DESIGNING');
});
```

---

## 8. 핵심 원칙 요약

1. **의존성 역전**: Domain이 Infrastructure를 모른다. Port(인터페이스)를 통해 소통한다.
2. **단일 책임**: Store는 캐시, UseCase는 워크플로우, Service는 비즈니스 규칙.
3. **교체 가능성**: DI Container에서 Mock ↔ Supabase 교체가 한 줄로 가능하다.
4. **순수성**: Domain 레이어에는 React, Zustand, Supabase import가 **없다**.
5. **점진적 마이그레이션**: 현재 모놀리식 Store와 공존하면서 모듈 단위로 전환한다.
