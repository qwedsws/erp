# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MoldERP — ERP system for HMLV (High Mix Low Volume) mold manufacturing. Korean-language business domain (금형 제조업). PRD at `/PRD.md`, architecture guide at `/clean_architecture.md`.

## Commands

```bash
npm run dev      # Start dev server (Next.js 16, localhost:3000)
npm run build    # Production build (includes TypeScript type checking)
npm run lint     # ESLint (enforces architectural layer boundaries)
```

No test runner is configured yet.

## Tech Stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand, Recharts, Supabase. shadcn/ui with **base-lyra** style (uses **Base UI**, not Radix) — icon library is lucide-react.

## Architecture

Clean Architecture with strict layer separation enforced by ESLint `no-restricted-imports` rules.

```
Presentation (app/, components/)
  → Hooks (hooks/)
    → Store (store/) — thin cache, no business logic
    → Infrastructure (infrastructure/) — repository implementations, DI container
      → Domain (domain/) — pure TypeScript, no React/Zustand/Supabase imports
```

**Dependency direction**: always outer → inner. ESLint enforces:
- `domain/` cannot import `@/types`
- `store/`, `hooks/`, `infrastructure/` cannot import `@/types` (use `domain/*/entities`)
- `app/`, `components/` cannot import `@/store` or `@/lib/store` (use domain hooks)

### Domain Layer (`domain/`)

8 domains: `materials`, `procurement`, `sales`, `projects`, `production`, `quality`, `admin`, `accounting`. Each has:
- `entities.ts` — re-exports from `domain/shared/entities.ts`
- `ports.ts` — repository interfaces (24 total across all domains)
- `services.ts` — pure business rules (e.g., `generatePostingFromEvent` in accounting)
- `use-cases/` — workflow orchestration (12 implemented)

Shared: `domain/shared/types.ts` exports `Result<T>`, `success()`, `failure()`, `generateId()`, `generateDocumentNo()`. `domain/shared/errors.ts` exports domain error classes.

### Infrastructure Layer (`infrastructure/`)

- `di/container.ts` — singleton factory functions (`getXRepository()`). Selects InMemory or Supabase implementation based on env vars `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`.
- `repositories/in-memory/` — 8 InMemory implementations (all domains)
- `repositories/supabase/` — 2 Supabase implementations (materials, procurement only)

### Store Layer (`store/`)

8 Zustand slices combined in `store/index.ts`. Each slice is a thin cache with state arrays and cache setter functions (e.g., `addCustomerToCache`, `updateCustomerInCache`). Initialized with mock data from `lib/mock-data.ts` and `lib/mock-accounting-data.ts`. No business logic in slices.

`lib/store.ts` re-exports `useERPStore` from `store/index.ts` for backward compatibility.

### Hooks Layer (`hooks/`)

45 hook files organized by domain across 10 directories (e.g., `hooks/sales/useCustomers.ts`). Standard pattern:
1. Read cached state from store via `useERPStore((s) => s.entities)`
2. Get repository from DI container (`getXRepository()`)
3. Provide async actions that call repo then update cache
4. Return `{ entities, action1, action2, ... }`

`hooks/shared/useAsyncAction.ts` provides `{ run, isLoading, error }` for boilerplate-free async state management.

### Presentation Layer

- `components/ui/` — shadcn/ui Base UI components
- `components/layout/` — AppLayout, Header, Sidebar
- `components/common/` — StatusBadge, DataTable, PageHeader, ConfirmDialog, PromptDialog, FeedbackToastProvider
- `app/` — 51 routes across 9 sections (dashboard, sales, projects, design, production, materials, quality, accounting, admin)

### Key Patterns

**StatusBadge + display maps**: `components/common/status-badge.tsx` is a generic badge component. All status/type display maps (label, color) are in `types/display.ts` (e.g., `PROJECT_STATUS_MAP`, `JOURNAL_ENTRY_STATUS_MAP`).

**`types/` directory**: `types/index.ts` re-exports all entities from `domain/shared/entities.ts`. `types/display.ts` has UI display maps. These are for **presentation-layer use only**; inner layers must import from `domain/*/entities`.

**Auto-journaling**: Accounting events fire automatically from `useOrders` (ORDER_CONFIRMED), `usePayments` (PAYMENT_CONFIRMED), and `usePurchaseOrders` (PO_ORDERED) hooks. These are wrapped in try/catch so accounting failures never block business transactions.

**Document numbering**: `generateDocumentNo(prefix, existingNumbers)` in `domain/shared/types.ts` produces `PREFIX-YYYY-###` format.

## Path Aliases

`@/*` maps to project root (tsconfig paths). Example: `@/domain/materials/entities`, `@/hooks/sales/useCustomers`.

## Adding New Features

When adding a new domain feature, follow this order:
1. Define entities in `domain/shared/entities.ts` (or domain-specific entities)
2. Define repository interface in `domain/<domain>/ports.ts`
3. Add use case in `domain/<domain>/use-cases/`
4. Implement repository in `infrastructure/repositories/in-memory/`
5. Register factory in `infrastructure/di/container.ts`
6. Add store slice cache setters in `store/<domain>-slice.ts`
7. Create hook in `hooks/<domain>/`
8. Build page in `app/<domain>/`
