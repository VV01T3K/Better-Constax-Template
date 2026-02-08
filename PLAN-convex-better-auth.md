# Plan: Convex + Better Auth (Local Install) for TanStack Start

## Context

The project is a TanStack Start app with Convex already integrated for real-time data (todos, products). Better Auth needs to be added using the **local install** pattern so all Better Auth plugins are available. The current Convex provider and router setup must be replaced with the auth-aware versions from `@convex-dev/better-auth`.

Primary documentation sources:
- https://labs.convex.dev/better-auth/framework-guides/tanstack-start
- https://labs.convex.dev/better-auth/features/local-install
- https://better-auth.com/docs/integrations/convex.mdx
- https://better-auth.com/docs/integrations/tanstack.mdx

---

## Step 1: Install packages

```bash
bun add @convex-dev/better-auth better-auth@1.4.9 --exact
```

Convex 1.27.3 already meets the >=1.25.0 requirement. `@types/node` already in devDeps.

---

## Step 2: Vite config — add SSR noExternal

**Modify:** `vite.config.ts`

Add `ssr.noExternal` to prevent SSR bundling failures:

```typescript
ssr: {
  noExternal: ['@convex-dev/better-auth'],
},
```

---

## Step 3: Convex component registration (local install)

**Create:** `convex/betterAuth/convex.config.ts` — component definition
```typescript
import { defineComponent } from "convex/server";
const component = defineComponent("betterAuth");
export default component;
```

**Create:** `convex/convex.config.ts` — register component with app
```typescript
import { defineApp } from "convex/server";
import betterAuth from "./betterAuth/convex.config";
const app = defineApp();
app.use(betterAuth);
export default app;
```

**Create:** `convex/auth.config.ts` — Convex auth provider
```typescript
import { getAuthConfigProvider } from '@convex-dev/better-auth/auth-config'
import type { AuthConfig } from 'convex/server'
export default {
  providers: [getAuthConfigProvider()],
} satisfies AuthConfig
```

---

## Step 4: Run `npx convex dev` to generate updated types

This generates `components.betterAuth` in `convex/_generated/api`. Required before the next step.

---

## Step 5: Better Auth instance (local install pattern)

**Create:** `convex/auth.ts` — main auth config with authComponent, createAuth, and getCurrentUser query
- Uses `createClient` with local schema for full type safety
- Exports `createAuthOptions` separately (needed by adapter)
- Exports `authComponent` (needed by http.ts)
- Exports `createAuth` factory (needed by http.ts)
- Exports `getCurrentUser` query using `ctx.auth.getUserIdentity()`
- Uses `better-auth/minimal` import for smaller bundle

**Create:** `convex/betterAuth/auth.ts` — thin wrapper for CLI schema generation only
```typescript
import { createAuth } from '../auth'
export const auth = createAuth({} as any)
```

---

## Step 6: Generate auth schema

```bash
cd convex/betterAuth && npx @better-auth/cli generate -y --output generatedSchema.ts
```

**Create:** `convex/betterAuth/schema.ts` — wraps generated schema with `defineSchema`

The existing `convex/schema.ts` (products, todos) stays unchanged — auth tables live inside the betterAuth component, separate from main app tables.

---

## Step 7: Adapter + HTTP router

**Create:** `convex/betterAuth/adapter.ts` — CRUD functions via `createApi(schema, createAuthOptions)`

**Create:** `convex/http.ts` — registers auth routes on Convex HTTP router
```typescript
import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
const http = httpRouter();
authComponent.registerRoutes(http, createAuth);
export default http;
```

---

## Step 8: Environment variables

**Modify:** `.env.local` — add:
```
VITE_SITE_URL=http://localhost:3000
```

**Set in Convex dashboard** (via `npx convex env set`):
```
BETTER_AUTH_SECRET=<openssl rand -base64 32>
SITE_URL=http://localhost:3000
```

---

## Step 9: Client-side auth

**Create:** `src/lib/auth-client.ts`
```typescript
import { createAuthClient } from 'better-auth/react'
import { convexClient } from '@convex-dev/better-auth/client/plugins'
export const authClient = createAuthClient({
  plugins: [convexClient()],
})
```

---

## Step 10: Server auth utilities

**Create:** `src/lib/auth-server.ts`
```typescript
import { convexBetterAuthReactStart } from '@convex-dev/better-auth/react-start'
export const { handler, getToken, fetchAuthQuery, fetchAuthMutation, fetchAuthAction } =
  convexBetterAuthReactStart({
    convexUrl: process.env.VITE_CONVEX_URL!,
    convexSiteUrl: process.env.VITE_CONVEX_SITE_URL!,
  })
```

---

## Step 11: Auth API proxy route

**Create:** `src/routes/api/auth/$.ts` — catches `/api/auth/*`, proxies GET/POST to Convex via `handler`

---

## Step 12: Update router

**Modify:** `src/router.tsx` — substantial rewrite:
- Create `ConvexQueryClient` with `expectAuth: true`
- Configure `QueryClient` with `queryKeyHashFn` and `queryFn` from ConvexQueryClient
- Add `convexQueryClient` to router context
- Add `Wrap` with `ConvexProvider` from `convex/react`
- Remove old `TanstackQuery.getContext()` usage

---

## Step 13: Update root layout

**Modify:** `src/routes/__root.tsx` — substantial rewrite:
- Add `beforeLoad` with `getAuth` server function to extract auth token from cookies
- Set `ctx.context.convexQueryClient.serverHttpClient?.setAuth(token)` for SSR
- Replace inner wrapping: use `ConvexBetterAuthProvider` with `authClient` and `initialToken`
- Add `convexQueryClient` to `MyRouterContext` interface
- Remove old `ConvexProvider` import/usage

---

## Step 14: Auth middleware

**Create:** `src/lib/auth-middleware.ts` — TanStack Start middleware using `getToken()`, redirects to `/auth/login` if unauthenticated

---

## Step 15: Login/signup page

**Create:** `src/routes/auth/login.tsx` — email/password sign-in and sign-up form using `authClient.signIn.email` and `authClient.signUp.email`

---

## Step 16: Update Header

**Modify:** `src/components/Header.tsx` — add Login/Sign Up nav link with `LogIn` icon from lucide-react

---

## Step 17: Cleanup

**Delete:** `src/integrations/convex/provider.tsx` — responsibilities moved to router.tsx (`Wrap`) and __root.tsx (`ConvexBetterAuthProvider`)

**Modify:** `src/integrations/tanstack-query/root-provider.tsx` — no longer needed for `getContext()` since QueryClient is created in router.tsx. Keep only if `Provider` component is still used elsewhere; otherwise delete.

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| Create | `convex/convex.config.ts` | Register betterAuth component |
| Create | `convex/auth.config.ts` | Convex auth provider config |
| Create | `convex/auth.ts` | authComponent, createAuth, getCurrentUser |
| Create | `convex/http.ts` | HTTP router with auth routes |
| Create | `convex/betterAuth/convex.config.ts` | Component definition |
| Create | `convex/betterAuth/auth.ts` | CLI schema generation wrapper |
| Create | `convex/betterAuth/schema.ts` | Schema wrapper |
| Create | `convex/betterAuth/adapter.ts` | CRUD adapter functions |
| Generate | `convex/betterAuth/generatedSchema.ts` | By @better-auth/cli |
| Create | `src/lib/auth-client.ts` | Client auth instance |
| Create | `src/lib/auth-server.ts` | Server auth utilities |
| Create | `src/lib/auth-middleware.ts` | Route protection middleware |
| Create | `src/routes/api/auth/$.ts` | Auth API proxy route |
| Create | `src/routes/auth/login.tsx` | Login/signup page |
| Modify | `vite.config.ts` | Add ssr.noExternal |
| Modify | `src/router.tsx` | ConvexQueryClient + expectAuth |
| Modify | `src/routes/__root.tsx` | ConvexBetterAuthProvider + beforeLoad |
| Modify | `src/components/Header.tsx` | Add login link |
| Modify | `.env.local` | Add VITE_SITE_URL |
| Delete | `src/integrations/convex/provider.tsx` | Replaced by router Wrap |

---

## Verification

1. Run `npx convex dev` in one terminal
2. Run `bun run dev` in another terminal
3. Navigate to `http://localhost:3000/auth/login`
4. Create an account (email + password)
5. Verify redirect to home after sign-up
6. Check Convex dashboard for user/session records in betterAuth component
7. Navigate to `/demo/convex` — verify todos still work with real-time sync
8. Test sign-out and verify page reloads (required with `expectAuth: true`)
9. Run `bun run typecheck` to verify no type errors
