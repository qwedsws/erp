# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages by domain (`sales`, `projects`, `materials`, `production`, `quality`, `admin`).
- `domain/`: Core business logic (entities, ports, use-cases). Keep this layer framework-agnostic.
- `infrastructure/`: Repository implementations (`in-memory`, `supabase`) and DI container (`infrastructure/di/container.ts`).
- `store/`: Zustand cache slices only; no heavy business rules.
- `hooks/`: Bridge layer from UI to domain/use-cases.
- `components/`: `ui/` (shadcn), `common/`, `layout/`.
- `PRD/`: Modular product requirements documents. Start at `PRD/README.md`.
- `lib/`, `types/`, `public/`: utilities, display/type maps, static assets.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start local dev server (`http://localhost:3000`).
- `npm run lint`: run ESLint (primary quality gate).
- `npm run build`: production build check.
- `npm run start`: run built app.
- Example targeted lint: `npx eslint app/materials/items/page.tsx`.

## Coding Style & Naming Conventions
- Language: TypeScript + React function components.
- Follow existing file style (generally 2-space indentation and clear semicolon usage).
- Naming:
  - Components: `PascalCase` (`PageHeader.tsx`)
  - Hooks: `useXxx` (`usePurchaseOrders.ts`)
  - Domain use-cases: kebab-case (`receive-purchase-order.ts`)
  - Store slices: `<domain>-slice.ts`
- Respect clean-architecture dependency direction: Presentation → Hooks → Store/Infrastructure → Domain.

## Testing Guidelines
- No dedicated test runner is currently configured.
- Minimum validation for changes:
  1. `npm run lint`
  2. `npm run build`
  3. Manual flow checks for affected screens/use-cases.
- If adding tests, prefer colocated `*.test.ts` / `*.test.tsx` near changed modules.

## Commit & Pull Request Guidelines
- Follow Conventional Commit style seen in history: `feat: ...`, `fix: ...`, `refactor: ...`.
- Keep commits scoped to one concern (e.g., domain rule, UI split, schema update).
- PRs should include:
  - What changed and why
  - Affected layers/files
  - Verification steps/commands run
  - Screenshots for UI changes
  - Migration/env updates (if any)

## Security & Configuration Tips
- Use `.env.local` for Supabase keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`).
- Never commit secrets. If env vars are missing, the app falls back to in-memory repositories.
