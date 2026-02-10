# MoldERP 클린 아키텍처 가이드

## 1. 개요

MoldERP는 **클린 아키텍처(Clean Architecture)** 원칙을 적용하여 비즈니스 로직을 UI 및 인프라로부터 완전히 분리했다.
이를 통해 테스트 용이성, 유지보수성, Repository 구현체 교체의 용이성(InMemory/Supabase)을 확보한다.

**현재 상태**: 클린 아키텍처 마이그레이션 완료. 8개 도메인 모두 Domain/Infrastructure/Store/Hooks 레이어로 분리됨.

---

## 2. 레이어 구조

```
┌──────────────────────────────────────────────────────┐
│                 Presentation Layer                    │
│         (app/, components/ — Next.js 페이지)          │
├──────────────────────────────────────────────────────┤
│                   Hooks Layer                        │
│     (hooks/ — React Hooks, 도메인 로직 ↔ React)       │
├──────────────────────────────────────────────────────┤
│                Store / State Layer                   │
│       (store/ — Zustand 슬라이스, 캐시 전용)           │
├──────────────────────────────────────────────────────┤
│              Infrastructure Layer                    │
│    (infrastructure/ — Repository 구현체, DI 컨테이너) │
├──────────────────────────────────────────────────────┤
│                  Domain Layer                        │
│  (domain/ — Entities, Ports, Services, Use Cases)    │
└──────────────────────────────────────────────────────┘
```

**의존성 방향**: 항상 바깥 → 안쪽. 내부 레이어는 외부를 절대 참조하지 않는다.

| 레이어 | 참조 가능 | 참조 불가 |
|--------|----------|----------|
| Domain | domain/ 자신만 | infrastructure/, store/, hooks/, app/, components/, types/ |
| Infrastructure | domain/ | store/, hooks/, app/, components/, types/ |
| Store | domain/ | hooks/, app/, components/, types/ |
| Hooks | domain/, infrastructure/, store/ | app/, components/, types/ |
| Presentation | hooks/, (store 읽기 선택자), types/ | domain/ 직접 참조, infrastructure/ 직접 참조 |

**ESLint 경계 강제**: `eslint.config.mjs`에 `no-restricted-imports` 규칙으로 레이어 위반을 빌드 시점에 검출한다.

---

## 3. 디렉토리 구조

```
/
├── domain/                           # 도메인 레이어 (순수 TypeScript, 외부 의존성 없음)
│   ├── shared/
│   │   ├── entities.ts               # 43개 엔티티 타입 (22 type aliases + 21 interfaces)
│   │   ├── types.ts                  # Result<T>, success(), failure(), generateId(), generateDocumentNo()
│   │   └── errors.ts                 # DomainError, ValidationError, NotFoundError 등
│   ├── materials/
│   │   ├── entities.ts               # domain/shared/entities 재수출
│   │   ├── ports.ts                  # IMaterialRepository, IStockRepository 등 5개 인터페이스
│   │   ├── services.ts               # calculateSteelWeight 등 비즈니스 규칙
│   │   └── use-cases/                # 6개 유스케이스 (receive-purchase-order, stock-out 등)
│   ├── procurement/
│   │   ├── entities.ts
│   │   ├── ports.ts                  # ISupplierRepository, IPurchaseOrderRepository 등 3개
│   │   ├── services.ts               # resolveApproverId, SupplierService 등
│   │   └── use-cases/                # 2개 (convert-requests-to-po, create-purchase-order)
│   ├── sales/
│   │   ├── entities.ts
│   │   ├── ports.ts                  # ICustomerRepository, IOrderRepository 등 3개
│   │   ├── services.ts
│   │   └── use-cases/                # 2개 (create-order-with-project, create-project-from-order)
│   ├── projects/
│   │   ├── entities.ts
│   │   ├── ports.ts                  # IProjectRepository, IProcessStepRepository
│   │   ├── services.ts
│   │   └── use-cases/                # 1개 (progress-design-step)
│   ├── production/
│   │   ├── entities.ts
│   │   ├── ports.ts                  # IWorkOrderRepository, IWorkLogRepository
│   │   └── services.ts
│   ├── quality/
│   │   ├── entities.ts
│   │   ├── ports.ts                  # IInspectionRepository, ITryoutRepository, IDefectRepository
│   │   └── services.ts
│   └── admin/
│       ├── entities.ts
│       ├── ports.ts                  # IProfileRepository
│       └── services.ts
│
├── infrastructure/                   # 인프라스트럭처 레이어
│   ├── di/
│   │   └── container.ts              # DI 컨테이너 — 싱글톤 팩토리 함수 (getXRepository)
│   └── repositories/
│       ├── in-memory/                # InMemory 구현체 (8개 도메인 전체 구현됨)
│       │   ├── sales.ts              # InMemoryCustomerRepository 등 3개
│       │   ├── projects.ts           # InMemoryProjectRepository 등 2개
│       │   ├── production.ts         # InMemoryWorkOrderRepository 등 2개
│       │   ├── materials.ts          # InMemoryMaterialRepository 등 5개
│       │   ├── procurement.ts        # InMemorySupplierRepository 등 3개
│       │   ├── quality.ts            # InMemoryInspectionRepository 등 3개
│       │   └── admin.ts              # InMemoryProfileRepository
│       └── supabase/                 # Supabase 구현체 (materials, procurement, projects, admin 구현됨)
│           ├── materials.ts          # SupabaseMaterialRepository 등 5개
│           ├── procurement.ts        # SupabaseSupplierRepository 등 3개
│           ├── projects.ts           # SupabaseProjectRepository 등 2개
│           └── admin.ts              # SupabaseProfileRepository
│
├── store/                            # Store 레이어 (Zustand — 캐시 전용, 비즈니스 로직 없음)
│   ├── index.ts                      # 8개 슬라이스 결합 (materials, procurement, sales, projects, production, quality, admin, accounting)
│   ├── materials-slice.ts
│   ├── procurement-slice.ts
│   ├── sales-slice.ts
│   ├── projects-slice.ts
│   ├── production-slice.ts
│   ├── quality-slice.ts
│   ├── admin-slice.ts
│   └── accounting-slice.ts
│
├── hooks/                            # Hooks 레이어 (React 브리지 — 56개 훅)
│   ├── materials/
│   │   ├── useMaterials.ts
│   │   ├── useStocks.ts
│   │   ├── useReceivingWorkflows.ts
│   │   └── ...
│   ├── procurement/
│   │   ├── useSuppliers.ts
│   │   ├── usePurchaseOrders.ts
│   │   └── ...
│   ├── sales/
│   │   ├── useCustomers.ts
│   │   ├── useOrders.ts
│   │   └── ...
│   ├── projects/
│   ├── production/
│   ├── quality/
│   ├── admin/
│   └── helpers/
│
├── types/                            # 프레젠테이션용 타입 재수출 (하위 호환성)
│   ├── index.ts                      # domain/shared/entities 재수출
│   └── display.ts                    # 상태 표시 맵 (PROJECT_STATUS_MAP 등)
│
├── app/                              # Presentation 레이어 (54개 페이지 라우트)
│   ├── page.tsx                      # 대시보드
│   ├── sales/                        # 영업 (4 페이지)
│   ├── projects/                     # 프로젝트 (10 페이지)
│   ├── design/                       # 설계 (5 페이지)
│   ├── production/                   # 생산 (12 페이지)
│   ├── materials/                    # 자재 (8 페이지)
│   ├── quality/                      # 품질 (5 페이지)
│   └── admin/                        # 관리 (2 페이지)
│
└── components/                       # Presentation 레이어 (공통 컴포넌트)
    ├── ui/                           # 20개 shadcn/ui Base UI 컴포넌트
    ├── layout/
    │   ├── app-layout.tsx
    │   ├── header.tsx
    │   └── sidebar.tsx
    └── common/
        ├── status-badge.tsx          # 범용 뱃지 (types/display.ts 맵과 함께 사용)
        ├── data-table.tsx
        ├── page-header.tsx
        ├── confirm-dialog.tsx
        └── prompt-dialog.tsx
```

---

## 4. 패턴 상세

### 4.1 Entity (도메인 엔티티)

엔티티는 순수 TypeScript 타입. `domain/shared/entities.ts`에 43개 엔티티 타입이 정의되어 있으며, 각 도메인 레이어의 `entities.ts`에서 필요한 타입을 재수출한다.

**특징**:
- snake_case 속성명 (Supabase PostgreSQL 컨벤션)
- 타임스탬프: `created_at`, `updated_at` (ISO 8601 문자열)
- ID는 UUID 문자열 (`generateId()` 사용)

```typescript
// domain/shared/entities.ts (실제 코드)
export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  department?: string;
  phone?: string;
  hourly_rate?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Customer {
  id: string;
  name: string;
  business_no?: string;
  representative?: string;
  address?: string;
  phone?: string;
  email?: string;
  payment_terms?: string;
  credit_limit?: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

각 도메인의 `entities.ts`는 재수출만 한다:

```typescript
// domain/materials/entities.ts
export type {
  Material,
  Stock,
  StockMovement,
  MaterialPrice,
  SteelTag,
  // ...
} from '../shared/entities';
```

### 4.2 Port (Repository 인터페이스)

Port는 도메인이 정의하는 추상 인터페이스. **구현체를 모른다.** 각 도메인의 `ports.ts`에 해당 도메인의 모든 Repository 인터페이스가 함께 정의된다.

```typescript
// domain/materials/ports.ts (실제 코드)
import type { Material, Stock, StockMovement, MaterialPrice, SteelTag } from './entities';

export interface IMaterialRepository {
  findAll(): Promise<Material[]>;
  findById(id: string): Promise<Material | null>;
  create(data: Omit<Material, 'id' | 'created_at' | 'updated_at'>): Promise<Material>;
  update(id: string, data: Partial<Material>): Promise<Material>;
  delete(id: string): Promise<void>;
}

export interface IStockRepository {
  findAll(): Promise<Stock[]>;
  findByMaterialId(materialId: string): Promise<Stock | null>;
  upsert(stock: Stock): Promise<Stock>;
}

export interface IStockMovementRepository {
  findAll(): Promise<StockMovement[]>;
  create(data: Omit<StockMovement, 'id' | 'created_at'>): Promise<StockMovement>;
}

export interface IMaterialPriceRepository {
  findAll(): Promise<MaterialPrice[]>;
  findByMaterial(materialId: string): Promise<MaterialPrice[]>;
  create(data: Omit<MaterialPrice, 'id' | 'created_at'>): Promise<MaterialPrice>;
  delete(id: string): Promise<void>;
}

export interface ISteelTagRepository {
  findAll(): Promise<SteelTag[]>;
  findById(id: string): Promise<SteelTag | null>;
  create(data: Omit<SteelTag, 'id' | 'created_at' | 'updated_at'>): Promise<SteelTag>;
  update(id: string, data: Partial<SteelTag>): Promise<SteelTag>;
  delete(id: string): Promise<void>;
}
```

전체 24개 Repository Port가 8개 도메인에 분산되어 정의됨.

### 4.3 Domain Service (도메인 서비스)

순수 비즈니스 규칙을 캡슐화한다. **외부 의존성 없음**, 순수 함수 또는 클래스로 구성.

```typescript
// domain/procurement/services.ts (실제 코드)
import type { Profile, Supplier } from './entities';
import type { ISupplierRepository } from './ports';

/**
 * 구매 요청 승인자 해결 로직.
 * 정책: 명시적 승인자가 없으면 활성 PURCHASE 또는 ADMIN 역할 사용자 중 첫 번째 선택.
 */
export function resolveApproverId(
  profiles: Pick<Profile, 'id' | 'is_active' | 'role'>[],
  approvedBy?: string,
): string {
  if (approvedBy) return approvedBy;

  const approver = profiles.find(
    (profile) =>
      profile.is_active && (profile.role === 'PURCHASE' || profile.role === 'ADMIN'),
  );

  if (!approver) {
    throw new Error('승인자를 찾을 수 없습니다. 사용자 데이터를 확인하세요.');
  }

  return approver.id;
}

export class SupplierService {
  constructor(private readonly supplierRepo: ISupplierRepository) {}

  async getAll(): Promise<Supplier[]> {
    return this.supplierRepo.findAll();
  }

  async getById(id: string): Promise<Supplier | null> {
    return this.supplierRepo.findById(id);
  }

  async create(data: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
    return this.supplierRepo.create(data);
  }

  async update(id: string, data: Partial<Supplier>): Promise<Supplier> {
    return this.supplierRepo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.supplierRepo.delete(id);
  }
}
```

### 4.4 Use Case (유스케이스)

복잡한 비즈니스 워크플로우를 캡슐화한다. Port(Repository)를 생성자로 주입받아 사용하며, `Result<T>` 타입을 반환한다.

```typescript
// domain/materials/use-cases/receive-purchase-order.ts (실제 코드 요약)
import type { MaterialPrice, Stock, StockMovement } from '../entities';
import type { PurchaseOrder, PurchaseOrderItem } from '../../procurement/entities';
import type { IStockRepository, IStockMovementRepository, IMaterialPriceRepository } from '../ports';
import type { IPurchaseOrderRepository } from '../../procurement/ports';
import { generateId, type Result, success, failure } from '@/domain/shared/types';
import { NotFoundError } from '@/domain/shared/errors';

export interface ReceivePOInput {
  poId: string;
  items: { item_id: string; quantity: number }[];
}

export interface ReceivePOResult {
  purchaseOrder: PurchaseOrder;
  movements: StockMovement[];
  stocks: Stock[];
  prices: MaterialPrice[];
}

export class ReceivePurchaseOrderUseCase {
  constructor(
    private readonly poRepo: IPurchaseOrderRepository,
    private readonly stockRepo: IStockRepository,
    private readonly movementRepo: IStockMovementRepository,
    private readonly priceRepo: IMaterialPriceRepository,
  ) {}

  async execute(input: ReceivePOInput): Promise<Result<ReceivePOResult>> {
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    // 1) 발주서 조회
    const po = await this.poRepo.findById(input.poId);
    if (!po) {
      return failure(new NotFoundError('PurchaseOrder', input.poId));
    }

    // 2) 입고 수량 집계 및 PO 아이템 업데이트
    const poItemById = new Map(po.items.map((item) => [item.id, item]));
    const receivedQtyByItemId = new Map<string, number>();
    for (const ri of input.items) {
      if (ri.quantity <= 0) continue;
      receivedQtyByItemId.set(ri.item_id, (receivedQtyByItemId.get(ri.item_id) ?? 0) + ri.quantity);
    }

    const updatedItems: PurchaseOrderItem[] = po.items.map(item => {
      const receivedQty = receivedQtyByItemId.get(item.id) ?? 0;
      if (receivedQty <= 0) return item;
      return { ...item, received_quantity: (item.received_quantity || 0) + receivedQty };
    });

    // 3) PO 상태 전환 (PARTIAL_RECEIVED / RECEIVED)
    const allReceived = updatedItems.every(item => (item.received_quantity || 0) >= item.quantity);
    const anyReceived = updatedItems.some(item => (item.received_quantity || 0) > 0);
    const newStatus = allReceived ? 'RECEIVED' : anyReceived ? 'PARTIAL_RECEIVED' : po.status;

    // 4) 재고 입고 처리 (StockMovement + Stock 업데이트)
    const movements: StockMovement[] = [];
    const updatedStocks: Stock[] = [];
    // ... (이동 평균 단가 계산 로직 생략)

    // 5) 자재 단가 이력 자동 등록
    const newPrices: MaterialPrice[] = [];
    // ... (기존 단가와 비교 후 신규 단가 이력 생성 로직 생략)

    // 6) PO 업데이트
    const updatedPO = await this.poRepo.update(input.poId, {
      items: updatedItems,
      status: newStatus,
    });

    return success({
      purchaseOrder: updatedPO,
      movements,
      stocks: updatedStocks,
      prices: newPrices,
    });
  }
}
```

**유스케이스 통계**:
- materials: 6개 (receive-purchase-order, stock-out, adjust-stock, bulk-adjust-stock, receive-direct-stock, transition-steel-tag-status)
- procurement: 3개 (convert-requests-to-po, create-purchase-order, create-purchase-requests-from-bom)
- sales: 2개 (create-order-with-project, create-project-from-order)
- projects: 1개 (progress-design-step)
- accounting: 1개 (post-accounting-event)

### 4.5 Repository 구현체 (Infrastructure)

Port의 실제 구현. InMemory와 Supabase 두 가지 구현체가 공존한다.

**InMemory 구현체** (전체 8개 도메인 구현됨):

```typescript
// infrastructure/repositories/in-memory/materials.ts (실제 코드)
import type {
  IMaterialRepository,
  IStockRepository,
  IStockMovementRepository,
  IMaterialPriceRepository,
  ISteelTagRepository,
} from '@/domain/materials/ports';
import type { Material, Stock, StockMovement, MaterialPrice, SteelTag } from '@/domain/materials/entities';
import { generateId } from '@/domain/shared/types';
import {
  mockMaterials,
  mockStocks,
  mockStockMovements,
  mockMaterialPrices,
  initialSteelTags,
} from '@/lib/mock-data';

export class InMemoryMaterialRepository implements IMaterialRepository {
  private data: Material[] = [...mockMaterials];

  async findAll(): Promise<Material[]> {
    return this.data;
  }

  async findById(id: string): Promise<Material | null> {
    return this.data.find(m => m.id === id) ?? null;
  }

  async create(data: Omit<Material, 'id' | 'created_at' | 'updated_at'>): Promise<Material> {
    const now = new Date().toISOString();
    const material: Material = { ...data, id: generateId(), created_at: now, updated_at: now };
    this.data.push(material);
    return material;
  }

  async update(id: string, data: Partial<Material>): Promise<Material> {
    const idx = this.data.findIndex(m => m.id === id);
    if (idx === -1) throw new Error(`Material not found: ${id}`);
    this.data[idx] = { ...this.data[idx], ...data, updated_at: new Date().toISOString() };
    return this.data[idx];
  }

  async delete(id: string): Promise<void> {
    this.data = this.data.filter(m => m.id !== id);
  }
}

export class InMemoryStockRepository implements IStockRepository {
  private data: Stock[] = [...mockStocks];

  async findAll(): Promise<Stock[]> {
    return this.data;
  }

  async findByMaterialId(materialId: string): Promise<Stock | null> {
    return this.data.find(s => s.material_id === materialId) ?? null;
  }

  async upsert(stock: Stock): Promise<Stock> {
    const idx = this.data.findIndex(s => s.id === stock.id);
    if (idx === -1) {
      this.data.push(stock);
    } else {
      this.data[idx] = stock;
    }
    return stock;
  }
}

// InMemoryStockMovementRepository, InMemoryMaterialPriceRepository, InMemorySteelTagRepository도 동일 패턴
```

**Supabase 구현체** (materials, procurement, projects, admin 구현됨):

```typescript
// infrastructure/repositories/supabase/materials.ts (일부)
import { supabase } from '@/lib/supabase/client';
import type { IMaterialRepository } from '@/domain/materials/ports';
import type { Material } from '@/domain/materials/entities';

export class SupabaseMaterialRepository implements IMaterialRepository {
  async findAll(): Promise<Material[]> {
    const { data, error } = await supabase.from('materials').select('*');
    if (error) throw error;
    return data || [];
  }

  async findById(id: string): Promise<Material | null> {
    const { data, error } = await supabase.from('materials').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  async create(data: Omit<Material, 'id' | 'created_at' | 'updated_at'>): Promise<Material> {
    const { data: result, error } = await supabase.from('materials').insert(data).select().single();
    if (error) throw error;
    return result;
  }

  async update(id: string, data: Partial<Material>): Promise<Material> {
    const { data: result, error } = await supabase.from('materials').update(data).eq('id', id).select().single();
    if (error) throw error;
    return result;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) throw error;
  }
}
```

### 4.6 DI Container (의존성 주입 컨테이너)

싱글톤 팩토리 함수로 구현. 환경 변수(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`)에 따라 InMemory 또는 Supabase 구현체를 반환한다.

```typescript
// infrastructure/di/container.ts (실제 코드)
import type { ICustomerRepository, IOrderRepository, IPaymentRepository } from '@/domain/sales/ports';
import type { IProjectRepository, IProcessStepRepository } from '@/domain/projects/ports';
import type { IWorkOrderRepository, IWorkLogRepository } from '@/domain/production/ports';
import type {
  IMaterialRepository,
  IStockRepository,
  IStockMovementRepository,
  IMaterialPriceRepository,
  ISteelTagRepository,
} from '@/domain/materials/ports';
import type {
  ISupplierRepository,
  IPurchaseOrderRepository,
  IPurchaseRequestRepository,
} from '@/domain/procurement/ports';
import type { IInspectionRepository, ITryoutRepository, IDefectRepository } from '@/domain/quality/ports';
import type { IProfileRepository } from '@/domain/admin/ports';

// InMemory 구현체
import { InMemoryCustomerRepository, InMemoryOrderRepository, InMemoryPaymentRepository } from '../repositories/in-memory/sales';
import { InMemoryProjectRepository, InMemoryProcessStepRepository } from '../repositories/in-memory/projects';
import { InMemoryWorkOrderRepository, InMemoryWorkLogRepository } from '../repositories/in-memory/production';
import {
  InMemoryMaterialRepository,
  InMemoryStockRepository,
  InMemoryStockMovementRepository,
  InMemoryMaterialPriceRepository,
  InMemorySteelTagRepository,
} from '../repositories/in-memory/materials';
import {
  InMemorySupplierRepository,
  InMemoryPurchaseOrderRepository,
  InMemoryPurchaseRequestRepository,
} from '../repositories/in-memory/procurement';
import { InMemoryInspectionRepository, InMemoryTryoutRepository, InMemoryDefectRepository } from '../repositories/in-memory/quality';
import { InMemoryProfileRepository } from '../repositories/in-memory/admin';

// Supabase 구현체
import {
  SupabaseMaterialRepository,
  SupabaseStockRepository,
  SupabaseStockMovementRepository,
  SupabaseMaterialPriceRepository,
  SupabaseSteelTagRepository,
} from '../repositories/supabase/materials';
import {
  SupabaseSupplierRepository,
  SupabasePurchaseOrderRepository,
  SupabasePurchaseRequestRepository,
} from '../repositories/supabase/procurement';

const USE_SUPABASE_REPOS = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
);

// --- Singletons ---
let customerRepo: ICustomerRepository | null = null;
let orderRepo: IOrderRepository | null = null;
let materialRepo: IMaterialRepository | null = null;
// ... (24개 Repository 싱글톤 변수)

export function getCustomerRepository(): ICustomerRepository {
  if (!customerRepo) {
    customerRepo = new InMemoryCustomerRepository();
  }
  return customerRepo;
}

export function getMaterialRepository(): IMaterialRepository {
  if (!materialRepo) {
    materialRepo = USE_SUPABASE_REPOS ? new SupabaseMaterialRepository() : new InMemoryMaterialRepository();
  }
  return materialRepo;
}

export function getStockRepository(): IStockRepository {
  if (!stockRepo) {
    stockRepo = USE_SUPABASE_REPOS ? new SupabaseStockRepository() : new InMemoryStockRepository();
  }
  return stockRepo;
}

// ... (총 24개 getXRepository() 팩토리 함수)
```

**패턴**:
- 각 Repository마다 `getXRepository()` 팩토리 함수
- 첫 호출 시 싱글톤 인스턴스 생성, 이후 재사용
- `USE_SUPABASE_REPOS` 플래그로 구현체 선택 (materials, procurement, projects, admin Supabase 구현 있음)

### 4.7 Store Slice (Zustand — 얇은 캐시)

스토어는 **비즈니스 로직 없이** 데이터 캐시와 캐시 수정 함수만 제공한다. 각 도메인마다 슬라이스가 1개씩 있으며, `store/index.ts`에서 결합된다.

```typescript
// store/materials-slice.ts (실제 코드)
import type { StateCreator } from 'zustand';
import type { Material, Stock, StockMovement, MaterialPrice, SteelTag } from '@/domain/materials/entities';
import { mockMaterials, mockStocks, mockStockMovements, mockMaterialPrices, initialSteelTags } from '@/lib/mock-data';

export interface MaterialsSlice {
  materials: Material[];
  stocks: Stock[];
  stockMovements: StockMovement[];
  materialPrices: MaterialPrice[];
  steelTags: SteelTag[];

  // Cache setters (비즈니스 로직 없음, 데이터 교체만)
  setMaterials: (materials: Material[]) => void;
  addMaterialToCache: (m: Material) => void;
  updateMaterialInCache: (id: string, data: Partial<Material>) => void;
  removeMaterialFromCache: (id: string) => void;

  setStocks: (stocks: Stock[]) => void;
  upsertStockInCache: (stock: Stock) => void;

  setStockMovements: (movements: StockMovement[]) => void;
  addStockMovementToCache: (sm: StockMovement) => void;

  setMaterialPrices: (prices: MaterialPrice[]) => void;
  addMaterialPriceToCache: (mp: MaterialPrice) => void;
  removeMaterialPriceFromCache: (id: string) => void;

  setSteelTags: (tags: SteelTag[]) => void;
  addSteelTagToCache: (tag: SteelTag) => void;
  updateSteelTagInCache: (id: string, data: Partial<SteelTag>) => void;
  removeSteelTagFromCache: (id: string) => void;
}

export const createMaterialsSlice: StateCreator<MaterialsSlice, [], [], MaterialsSlice> = (set) => ({
  materials: mockMaterials,
  stocks: mockStocks,
  stockMovements: mockStockMovements,
  materialPrices: mockMaterialPrices,
  steelTags: initialSteelTags,

  setMaterials: (materials) => set({ materials }),
  addMaterialToCache: (m) => set((state) => ({ materials: [...state.materials, m] })),
  updateMaterialInCache: (id, data) =>
    set((state) => ({
      materials: state.materials.map((m) => (m.id === id ? { ...m, ...data } : m)),
    })),
  removeMaterialFromCache: (id) =>
    set((state) => ({ materials: state.materials.filter((m) => m.id !== id) })),

  setStocks: (stocks) => set({ stocks }),
  upsertStockInCache: (stock) =>
    set((state) => {
      const idx = state.stocks.findIndex((s) => s.id === stock.id);
      if (idx === -1) return { stocks: [...state.stocks, stock] };
      const updated = [...state.stocks];
      updated[idx] = stock;
      return { stocks: updated };
    }),

  setStockMovements: (movements) => set({ stockMovements: movements }),
  addStockMovementToCache: (sm) => set((state) => ({ stockMovements: [...state.stockMovements, sm] })),

  setMaterialPrices: (prices) => set({ materialPrices: prices }),
  addMaterialPriceToCache: (mp) => set((state) => ({ materialPrices: [...state.materialPrices, mp] })),
  removeMaterialPriceFromCache: (id) =>
    set((state) => ({ materialPrices: state.materialPrices.filter((p) => p.id !== id) })),

  setSteelTags: (tags) => set({ steelTags: tags }),
  addSteelTagToCache: (tag) => set((state) => ({ steelTags: [...state.steelTags, tag] })),
  updateSteelTagInCache: (id, data) =>
    set((state) => ({
      steelTags: state.steelTags.map((t) => (t.id === id ? { ...t, ...data } : t)),
    })),
  removeSteelTagFromCache: (id) =>
    set((state) => ({ steelTags: state.steelTags.filter((t) => t.id !== id) })),
});
```

**핵심 원칙**: 슬라이스에는 `addMaterial()`, `receivePurchaseOrder()` 같은 비즈니스 워크플로우가 **없다**. 오직 캐시 CRUD만 존재한다.

**하위 호환성**: `store/legacy-actions-slice.ts`가 기존 모놀리식 스토어의 액션 함수들을 보존하고 있으며, `lib/store.ts`에서 `useERPStore`를 재수출하여 기존 컴포넌트들이 계속 작동하도록 함.

### 4.8 Hook (React 브리지)

도메인 로직과 React 컴포넌트를 연결하는 다리. **표준 패턴**:

1. `useERPStore` 선택자로 캐시된 상태 읽기
2. DI 컨테이너에서 Repository 가져오기
3. 비동기 액션 함수에서 Repository 호출 후 캐시 업데이트
4. 상태와 액션 함수를 반환

```typescript
// hooks/materials/useMaterials.ts (실제 코드)
'use client';

import { useERPStore } from '@/store';
import { getMaterialRepository, getMaterialPriceRepository } from '@/infrastructure/di/container';

export function useMaterials() {
  const materials = useERPStore((s) => s.materials);
  const materialPrices = useERPStore((s) => s.materialPrices);
  const addToCache = useERPStore((s) => s.addMaterialToCache);
  const updateInCache = useERPStore((s) => s.updateMaterialInCache);
  const removeFromCache = useERPStore((s) => s.removeMaterialFromCache);
  const addPriceToCache = useERPStore((s) => s.addMaterialPriceToCache);
  const removePriceFromCache = useERPStore((s) => s.removeMaterialPriceFromCache);

  const repo = getMaterialRepository();
  const priceRepo = getMaterialPriceRepository();

  const addMaterial = async (data: Parameters<typeof repo.create>[0]) => {
    const material = await repo.create(data);
    addToCache(material);
    return material;
  };

  const updateMaterial = async (id: string, data: Parameters<typeof repo.update>[1]) => {
    const updated = await repo.update(id, data);
    updateInCache(id, updated);
    return updated;
  };

  const deleteMaterial = async (id: string) => {
    await repo.delete(id);
    removeFromCache(id);
  };

  const addMaterialPrice = async (data: Parameters<typeof priceRepo.create>[0]) => {
    const price = await priceRepo.create(data);
    addPriceToCache(price);
    return price;
  };

  const deleteMaterialPrice = async (id: string) => {
    await priceRepo.delete(id);
    removePriceFromCache(id);
  };

  return {
    materials,
    materialPrices,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    addMaterialPrice,
    deleteMaterialPrice,
  };
}
```

**유스케이스 사용 예시**:

```typescript
// hooks/materials/useReceivingWorkflows.ts (실제 코드 일부)
'use client';

import { useMemo } from 'react';
import { useMaterials } from '@/hooks/materials/useMaterials';
import { usePurchaseOrders } from '@/hooks/procurement/usePurchaseOrders';
import { useSteelTags } from '@/hooks/procurement/useSteelTags';
import { useStocks } from '@/hooks/materials/useStocks';

export interface POReceiveItemInput {
  item_id: string;
  material_id: string;
  quantity: number;
}

export function useReceivingWorkflows() {
  const { materials } = useMaterials();
  const { receivePurchaseOrder } = usePurchaseOrders();
  const { addSteelTag } = useSteelTags();
  const { addStockMovement } = useStocks();

  const materialById = useMemo(
    () => new Map(materials.map((material) => [material.id, material])),
    [materials],
  );

  const receiveFromPurchaseOrder = async (input: {
    poId: string;
    receivedAt: string;
    items: POReceiveItemInput[];
    steelTagEntriesByItem: Record<string, SteelTagEntryInput[]>;
  }) => {
    const itemsToReceive = input.items.filter((item) => item.quantity > 0);
    if (!input.poId) throw new Error('발주서를 선택하세요');
    if (itemsToReceive.length === 0) throw new Error('입고 수량을 입력하세요');

    // Use Case 호출 (receivePurchaseOrder 내부에서 ReceivePurchaseOrderUseCase 실행)
    await receivePurchaseOrder({
      poId: input.poId,
      items: itemsToReceive.map((item) => ({ item_id: item.item_id, quantity: item.quantity })),
    });

    // 강재 태그 생성 (강재인 경우)
    // ... 로직 생략
  };

  return {
    receiveFromPurchaseOrder,
  };
}
```

**훅 통계**: 총 56개 훅 파일 (materials, procurement, sales, projects, production, quality, admin, accounting, shared 디렉토리에 분산).

---

## 5. 데이터 흐름

### 5.1 읽기 흐름 (Query)

```
Page/Component (app/materials/page.tsx)
  → useMaterials() Hook
    → useERPStore((s) => s.materials)  [캐시 읽기]
  ← materials 데이터 반환
```

캐시가 비어 있거나 초기화가 필요한 경우:

```
Page/Component
  → useMaterials() Hook
    → getMaterialRepository()         [DI Container]
    → repo.findAll()                  [InMemory or Supabase]
    → addToCache(materials)           [Store 캐시 갱신]
  ← materials 데이터 반환
```

### 5.2 쓰기 흐름 (Command)

```
Page/Component: "입고 처리" 버튼 클릭
  → useReceivingWorkflows().receiveFromPurchaseOrder() Hook
    → usePurchaseOrders().receivePurchaseOrder()
      → ReceivePurchaseOrderUseCase.execute()  [Domain Use Case]
        → poRepo.findById()                    [발주서 조회]
        → movementRepo.create()                [입고 이동 생성]
        → stockRepo.upsert()                   [재고 업데이트 (이동 평균 단가)]
        → priceRepo.create()                   [자재 단가 이력 생성]
        → poRepo.update()                      [발주서 상태 전환]
      ← Result<ReceivePOResult> 반환
    → usePurchaseOrders() 내부에서 캐시 갱신 (updatePOInCache 등)
  ← UI 자동 리렌더링 (Zustand 상태 변경 감지)
```

**특징**:
- Repository 메서드 내부에서 Store 직접 접근하지 않음 (순수성 유지)
- Hook에서 Repository 호출 후 결과를 받아 캐시 업데이트 함수 호출
- `Result<T>` 타입으로 성공/실패 명시적 처리

---

## 6. ESLint 경계 강제

`eslint.config.mjs`에 `no-restricted-imports` 규칙을 정의하여 레이어 간 의존성 위반을 빌드 시점에 검출한다.

```javascript
// eslint.config.mjs (실제 코드)
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["domain/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/types",
              message: "Domain 레이어는 '@/types'를 참조하지 말고 domain 내부 entities를 사용하세요.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "store/**/*.{js,jsx,ts,tsx}",
      "hooks/**/*.{js,jsx,ts,tsx}",
      "infrastructure/**/*.{js,jsx,ts,tsx}",
      "lib/supabase/**/*.{js,jsx,ts,tsx}",
      "lib/mock-data.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/types",
              message:
                "Application/Infrastructure 레이어는 '@/types' 대신 domain/*/entities 또는 domain/shared/entities를 사용하세요.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["app/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/store",
              message: "Presentation 레이어에서는 store를 직접 import하지 말고 domain hook을 사용하세요.",
            },
            {
              name: "@/store",
              message: "Presentation 레이어에서는 store를 직접 import하지 말고 domain hook을 사용하세요.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["components/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/store",
              message: "Presentation 레이어에서는 store를 직접 import하지 말고 domain hook을 사용하세요.",
            },
            {
              name: "@/store",
              message: "Presentation 레이어에서는 store를 직접 import하지 말고 domain hook을 사용하세요.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
```

**적용 범위**:
- `domain/` 파일들은 `@/types` import 금지 (domain 내부 entities만 사용)
- `store/`, `hooks/`, `infrastructure/` 파일들은 `@/types` import 금지
- `app/`, `components/` 파일들은 `@/store` 또는 `@/lib/store` import 금지 (Hook 경유 필수)

**결과**: `npm run lint` 실행 시 레이어 위반이 있으면 빌드 실패.

---

## 7. 공유 유틸리티 및 타입

### 7.1 도메인 공유 타입 (`domain/shared/types.ts`)

```typescript
// domain/shared/types.ts (실제 코드)
// Result type for use case return values
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function success<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function failure<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// ID generation
export function generateId(): string {
  return crypto.randomUUID();
}

// Document number generation (PREFIX-YYYY-### 형식)
export function generateDocumentNo(
  prefix: string,
  existingNumbers: string[],
  padLen: number = 3,
): string {
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-`;
  const existing = existingNumbers.filter(no => no.startsWith(pattern));
  const maxNum = existing.reduce((max, no) => {
    const num = parseInt(no.replace(pattern, ''));
    return num > max ? num : max;
  }, 0);
  return `${pattern}${String(maxNum + 1).padStart(padLen, '0')}`;
}
```

**사용 예**:
- `generateDocumentNo('PO', existingPONumbers)` → `PO-2026-001`
- `generateId()` → `550e8400-e29b-41d4-a716-446655440000`

### 7.2 도메인 에러 클래스 (`domain/shared/errors.ts`)

```typescript
// domain/shared/errors.ts (실제 코드)
export class DomainError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, public readonly field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class RepositoryError extends DomainError {
  constructor(message: string, public readonly cause?: unknown) {
    super(message, 'REPOSITORY_ERROR');
    this.name = 'RepositoryError';
  }
}

export class InsufficientStockError extends DomainError {
  constructor(materialId: string, requested: number, available: number) {
    super(
      `Insufficient stock for material ${materialId}: requested ${requested}, available ${available}`,
      'INSUFFICIENT_STOCK',
    );
    this.name = 'InsufficientStockError';
  }
}
```

### 7.3 프레젠테이션 타입 재수출 (`types/`)

하위 호환성을 위해 `types/index.ts`는 `domain/shared/entities.ts`를 재수출한다.

```typescript
// types/index.ts
export type {
  Profile,
  UserRole,
  Customer,
  Order,
  OrderItem,
  OrderStatus,
  // ... (43개 타입 전체 재수출)
} from '@/domain/shared/entities';
```

`types/display.ts`는 상태 표시 맵을 제공 (프레젠테이션 레이어 전용):

```typescript
// types/display.ts (일부)
import type { OrderStatus, ProjectStatus, WorkOrderStatus, SteelTagStatus } from './index';

export const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  CONFIRMED: { label: '확정', color: 'blue' },
  IN_PROGRESS: { label: '진행중', color: 'yellow' },
  COMPLETED: { label: '완료', color: 'green' },
  CANCELLED: { label: '취소', color: 'gray' },
};

export const PROJECT_STATUS_MAP: Record<ProjectStatus, { label: string; color: string }> = {
  CONFIRMED: { label: '수주확정', color: 'blue' },
  DESIGNING: { label: '설계중', color: 'purple' },
  DESIGN_COMPLETE: { label: '설계완료', color: 'cyan' },
  // ... (12개 상태)
};

// ... (10개 이상의 상태 맵)
```

**사용 예 (프레젠테이션 레이어)**:

```tsx
// components/common/status-badge.tsx
import { Badge } from '@/components/ui/badge';
import { PROJECT_STATUS_MAP } from '@/types/display';

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const { label, color } = PROJECT_STATUS_MAP[status];
  return <Badge color={color}>{label}</Badge>;
}
```

---

## 8. 테스트 전략

클린 아키텍처의 가장 큰 이점은 **계층별 독립 테스트**가 가능하다는 점이다.

| 레이어 | 테스트 종류 | 의존성 | 테스트 대상 |
|--------|-----------|--------|----------|
| Domain Service | 단위 테스트 | 없음 (순수 함수) | `domain/*/services.ts`의 순수 비즈니스 규칙 |
| Use Case | 단위 테스트 | Port 인터페이스 Mock | `domain/*/use-cases/*.ts`의 워크플로우 로직 |
| Repository | 통합 테스트 | InMemory: 메모리 / Supabase: 테스트 DB | `infrastructure/repositories/` 구현체 |
| Hook | 컴포넌트 테스트 | DI Container Mock | `hooks/` React 브리지 동작 |
| Page | E2E 테스트 | 전체 스택 | `app/` 페이지 시나리오 |

**테스트 예시** (아직 구현 안 됨, 권장 패턴):

```typescript
// domain/procurement/services.test.ts
import { resolveApproverId } from './services';
import type { Profile } from './entities';

describe('resolveApproverId', () => {
  const mockProfiles: Pick<Profile, 'id' | 'is_active' | 'role'>[] = [
    { id: 'user-1', is_active: true, role: 'ENGINEER' },
    { id: 'user-2', is_active: true, role: 'PURCHASE' },
    { id: 'user-3', is_active: false, role: 'ADMIN' },
  ];

  it('명시적 approvedBy가 있으면 그대로 반환', () => {
    expect(resolveApproverId(mockProfiles, 'custom-approver')).toBe('custom-approver');
  });

  it('approvedBy 없으면 활성 PURCHASE 사용자 선택', () => {
    expect(resolveApproverId(mockProfiles)).toBe('user-2');
  });

  it('적합한 승인자가 없으면 에러', () => {
    const inactiveOnly = [{ id: 'user-1', is_active: false, role: 'ADMIN' }];
    expect(() => resolveApproverId(inactiveOnly)).toThrow('승인자를 찾을 수 없습니다');
  });
});

// domain/materials/use-cases/receive-purchase-order.test.ts
import { ReceivePurchaseOrderUseCase } from './receive-purchase-order';
import type { IPurchaseOrderRepository, IStockRepository, IStockMovementRepository, IMaterialPriceRepository } from '../ports';

describe('ReceivePurchaseOrderUseCase', () => {
  let useCase: ReceivePurchaseOrderUseCase;
  let mockPORepo: jest.Mocked<IPurchaseOrderRepository>;
  let mockStockRepo: jest.Mocked<IStockRepository>;
  let mockMovementRepo: jest.Mocked<IStockMovementRepository>;
  let mockPriceRepo: jest.Mocked<IMaterialPriceRepository>;

  beforeEach(() => {
    mockPORepo = {
      findById: jest.fn(),
      update: jest.fn(),
      // ... 나머지 메서드 mock
    };
    mockStockRepo = { /* ... */ };
    mockMovementRepo = { /* ... */ };
    mockPriceRepo = { /* ... */ };

    useCase = new ReceivePurchaseOrderUseCase(mockPORepo, mockStockRepo, mockMovementRepo, mockPriceRepo);
  });

  it('존재하지 않는 PO는 NotFoundError 반환', async () => {
    mockPORepo.findById.mockResolvedValue(null);

    const result = await useCase.execute({ poId: 'invalid-id', items: [] });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('NotFoundError');
    }
  });

  it('입고 처리 시 재고 이동 평균 단가 계산', async () => {
    mockPORepo.findById.mockResolvedValue({
      id: 'po-1',
      supplier_id: 'supplier-1',
      items: [{ id: 'item-1', material_id: 'mat-1', quantity: 100, unit_price: 1000, received_quantity: 0 }],
      status: 'CONFIRMED',
      // ...
    });
    mockStockRepo.findByMaterialId.mockResolvedValue({
      id: 'stock-1',
      material_id: 'mat-1',
      quantity: 50,
      avg_unit_price: 900,
      // ...
    });
    mockMovementRepo.create.mockImplementation((data) => Promise.resolve({ id: 'mv-1', ...data, created_at: 'now' }));
    mockStockRepo.upsert.mockImplementation((stock) => Promise.resolve(stock));
    mockPriceRepo.findAll.mockResolvedValue([]);
    mockPriceRepo.create.mockImplementation((data) => Promise.resolve({ id: 'price-1', ...data, created_at: 'now' }));
    mockPORepo.update.mockImplementation((id, data) => Promise.resolve({ id, ...data } as any));

    const result = await useCase.execute({ poId: 'po-1', items: [{ item_id: 'item-1', quantity: 50 }] });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stocks[0].quantity).toBe(100); // 50 + 50
      expect(result.value.stocks[0].avg_unit_price).toBe(933); // (50*900 + 50*1000) / 100 = 933 (반올림)
      expect(result.value.purchaseOrder.status).toBe('PARTIAL_RECEIVED');
    }
  });
});
```

**권장 테스트 도구**:
- 단위/통합 테스트: Jest 또는 Vitest
- E2E 테스트: Playwright
- React 컴포넌트 테스트: Testing Library

---

## 9. 핵심 원칙 요약

1. **의존성 역전 (Dependency Inversion)**: Domain이 Infrastructure를 모른다. Port(인터페이스)를 통해 소통한다.
2. **단일 책임 (Single Responsibility)**: Store는 캐시, Use Case는 워크플로우, Service는 비즈니스 규칙, Repository는 데이터 접근.
3. **교체 가능성 (Substitutability)**: DI Container에서 InMemory/Supabase 구현체를 환경 변수로 교체 가능.
4. **순수성 (Purity)**: Domain 레이어에는 React, Zustand, Supabase import가 **없다**. 순수 TypeScript만 사용.
5. **명시적 에러 처리**: `Result<T>` 타입으로 성공/실패를 명시적으로 반환.
6. **경계 강제**: ESLint `no-restricted-imports` 규칙으로 레이어 위반을 빌드 시점에 검출.
7. **문서 번호 표준화**: `generateDocumentNo(prefix, existingNumbers)` → `PREFIX-YYYY-###` 형식 (예: `PO-2026-001`).

---

## 10. 현재 구현 현황

### 구현 완료

- 8개 도메인 모두 클린 아키텍처로 분리 완료
- 43개 엔티티 타입 정의 (`domain/shared/entities.ts`)
- 24개 Repository Port 인터페이스 (8개 도메인에 분산)
- 13개 Use Case 구현
  - materials: 6개
  - procurement: 3개
  - sales: 2개
  - projects: 1개
  - accounting: 1개
- 8개 InMemory Repository 구현 (전체 도메인)
- 4개 Supabase Repository 구현 (materials, procurement, projects, admin)
- 8개 Zustand Store Slice
- 56개 Domain Hook
- 54개 페이지 라우트
- ESLint 경계 강제 규칙 적용

### 향후 작업

1. **Supabase Repository 확장**: 나머지 4개 도메인(sales, production, quality, accounting)의 Supabase 구현체 추가
2. **Use Case 추가**: 복잡한 비즈니스 워크플로우를 더 많이 Use Case로 추출 (현재 13개)
3. **테스트 작성**: Jest/Vitest로 Domain Service 및 Use Case 단위 테스트 추가
4. **레거시 액션 제거**: `legacy-actions-slice.ts`에 남아 있는 레거시 액션들을 점진적으로 Domain Hook으로 전환
5. **에러 핸들링 강화**: `Result<T>` 타입을 더 많은 곳에서 활용하여 에러 처리 명시화
6. **문서화**: API 문서, 아키텍처 결정 기록(ADR) 추가

---

## 11. 참고 자료

- PRD: `/Users/kyungsikkim/erp/PRD.md`
- 프로젝트 메모리: `~/.claude/projects/-Users-kyungsikkim-erp/memory/MEMORY.md`
- CLAUDE.md: `/Users/kyungsikkim/erp/CLAUDE.md`
- 타입 정의: `/Users/kyungsikkim/erp/domain/shared/entities.ts` (384줄, 43개 엔티티)
- DI Container: `/Users/kyungsikkim/erp/infrastructure/di/container.ts` (18개 팩토리 함수)
- ESLint 설정: `/Users/kyungsikkim/erp/eslint.config.mjs`

**이 문서는 실제 구현된 코드베이스를 반영한 최신 버전입니다.** (2026-02-10 업데이트)
