# Better Constax Template

Full-stack TanStack Start template with React 19, Convex, Better Auth, and TanStack Query.

## Quick Start

1. Install tools via `mise` and dependencies:

```bash
mise install
mise exec -- bun install
```

2. Configure environment in `.env.local`:

```bash
CONVEX_DEPLOYMENT=...
VITE_CONVEX_URL=...
VITE_CONVEX_SITE_URL=...
BETTER_AUTH_ADMIN_EMAILS=admin@example.com
```

3. Run app and Convex:

```bash
mise exec -- bun run dev
mise exec -- bunx convex dev
```

## Commands (Mise-first)

```bash
mise exec -- bun run dev
mise exec -- bun run build
mise exec -- bun run preview
mise exec -- bun run lint
mise exec -- bun run format
mise exec -- bun run check
mise exec -- bun run test
mise exec -- bun run auth:generate
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

This keeps old demos available without forcing all of them to match current production patterns.

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
