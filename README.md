# Better Constax Template

Full-stack TanStack Start monorepo with React 19, Convex, Better Auth, TanStack Query, and Turborepo.

## Workspace Layout

- `apps/web` - TanStack Start app (SSR/streaming via Nitro)
- `apps/convex` - Convex backend source (`apps/convex/convex`)
- `packages` - reserved for future shared packages

## Quick Start

1. Install tools and dependencies:

```bash
mise install
mise exec -- bun install
```

2. Configure environment files:

`apps/web/.env.local`

```bash
CONVEX_DEPLOYMENT=...
VITE_CONVEX_URL=...
VITE_CONVEX_SITE_URL=...
BETTER_AUTH_ADMIN_EMAILS=admin@gmail.com
```

`apps/convex/.env.local`

```bash
CONVEX_DEPLOYMENT=...
VITE_CONVEX_URL=...
VITE_CONVEX_SITE_URL=...
BETTER_AUTH_ADMIN_EMAILS=admin@gmail.com
```

3. Run the full dev stack:

```bash
mise exec -- bun run dev
```

## Commands (Mise-first)

```bash
mise exec -- bun run dev          # web + convex
mise exec -- bun run dev:web      # web only
mise exec -- bun run dev:convex   # convex only
mise exec -- bun run build        # web build
mise exec -- bun run preview      # web preview
mise exec -- bun run lint
mise exec -- bun run format
mise exec -- bun run check
mise exec -- bun run auth:generate
mise exec -- bun run convex:env
```

## Architecture

- Framework: TanStack Start (TanStack Router + Nitro)
- Backend: Convex (queries/mutations/actions)
- Auth: Better Auth with Convex adapter
- Server state: TanStack Query + `@convex-dev/react-query`
- Styling: Tailwind CSS 4

## Demo Navigation Model

The side nav intentionally has two groups:

- `Core`: actively maintained reference demos
- `Legacy demos (may break)`: kept for reference, not actively hardened

## Core Data/Auth Defaults

- Prefer Convex + TanStack Query integration
- Prefer loader prefetch + suspense query consumption for critical route data
- Keep auth parity across SSR and client (token bootstrap + query invalidation on auth transitions)
- Treat TanStack Query optimistic flow as the default pattern for CRUD UIs

## Massive Data Demo

Route: `/demo/massive-data`

What it demonstrates:

- Convex-backed deterministic dataset (no seed step)
- Paginated query mode
- Infinite query mode
- Virtualized rendering with TanStack Virtual for smooth scrolling on very large row counts

Backend API:

- `api.massiveDataset.page({ cursor, limit })`
- Returns `{ rows, nextCursor, totalRows, hasMore, limit }`

## Notes

- Files prefixed with `demo` remain safe to change/remove based on product needs.
- If you regenerate auth schema, re-run:

```bash
mise exec -- bun run auth:generate
```
