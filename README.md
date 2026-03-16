# Better Constax Template

Full-stack TanStack Start template with React 19, Convex, Better Auth, and TanStack Query.

## What You Get

- Email/password auth with Better Auth
- Role and permission-based access control
- Admin user management with impersonation
- Convex-backed demos for optimistic updates, file upload, forms, tables, and large datasets
- SSR-ready app shell with TanStack Router, Query, and Convex integration

## Stack

- TanStack Start + React 19
- Convex + `@convex-dev/react-query`
- Better Auth
- Tailwind CSS 4
- Bun

## Setup

1. Install dependencies:

```bash
bun install
```

If Bun is not available locally, use `mise`:

```bash
mise install
mise exec -- bun install
```

2. Create `.env.local`:

```bash
CONVEX_DEPLOYMENT=...
VITE_CONVEX_URL=...
VITE_CONVEX_SITE_URL=...
```

3. Set Convex environment variables for auth:

- `BETTER_AUTH_SECRET`
- `SITE_URL` (for local dev: `http://localhost:3000`)
- `BETTER_AUTH_ADMIN_EMAILS` (optional comma-separated admin allowlist)

4. Start the app and Convex:

```bash
bun run dev
npx convex dev
```

## Commands

```bash
bun run dev
bun run build
bun run lint
bun run format
bun run check
bun run auth:generate
```

## Notes

- `src/routeTree.gen.ts` and `convex/_generated/*` are generated files.
- Files prefixed with `demo` are example code and can be removed or replaced.
