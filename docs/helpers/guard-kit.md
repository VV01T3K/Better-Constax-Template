# Guard Kit

Canonical auth/permission helpers for Convex handlers and TanStack route loaders.

## Convex helpers (`convex/lib/guardKit.ts`)

### `getActor(ctx, options?)`

- Returns a normalized actor object:
  - `identity`
  - `userId` (`AuthUserId`)
  - `role`
  - `permissions`
- Throws `UNAUTHORIZED` if no identity is present.
- `options.resolveRoleAndPermissions` can be supplied for tests or custom resolver wiring.

### `requireAllPermissions(actor, required, options?)`

- Ensures actor has every permission in `required`.
- Throws `FORBIDDEN` when any required permission is missing.

### `requireAnyPermission(actor, required, options?)`

- Ensures actor has at least one permission in `required`.
- Throws `FORBIDDEN` when none are present.

### `requireRoleOrPermissions(actor, options)`

- Allows access if actor matches role or satisfies permission requirement.
- `options.mode`:
  - `"any"` (default): any permission in `options.permissions`
  - `"all"`: all permissions in `options.permissions`

### `guardedQuery({ args, access, handler })`

- Authenticated query builder with composable access checks.
- `access` supports:
  - `{ type: "authenticated" }`
  - `{ type: "role", role }`
  - `{ type: "allPermissions", permissions }`
  - `{ type: "anyPermission", permissions }`
  - `{ type: "roleOrPermissions", role, permissions, mode? }`
  - `{ type: "custom", check }`
  - Dynamic resolver: `({ args, actor }) => rule | boolean`
- `handler` receives `(ctx, args, actor)`.

### `guardedMutation({ args, access, handler })`

- Same behavior as `guardedQuery`, but for mutations.

## Route helpers (`src/lib/route-guard-kit.ts`)

### `protectedRouteLoader({ queryClient, redirectHref, permission?, prefetch? })`

- Enforces authentication.
- If `permission` is provided, also enforces permission.
- Redirect behavior:
  - Unauthenticated -> `/auth/login?redirect=<redirectHref>`
  - Unauthorized -> `/forbidden`
- Runs optional `prefetch` after access is granted.

## Helper Selection Matrix

| Need                                                     | Use                                                                         |
| -------------------------------------------------------- | --------------------------------------------------------------------------- |
| Convex query/mutation requiring auth + permission gate   | `guardedQuery` / `guardedMutation`                                          |
| Access checks inside business logic using existing actor | `requireAllPermissions`, `requireAnyPermission`, `requireRoleOrPermissions` |
| Route auth guard (with optional prefetch)                | `protectedRouteLoader`                                                      |

## Anti-Patterns

- Do not re-fetch identity repeatedly inside guarded handlers; use injected `actor`.
- Do not manually duplicate login/forbidden redirect logic in route loaders.
- Do not hardcode role parsing logic in feature code; use actor role from helpers.
- Do not mix multiple ad-hoc permission checks in handlers when one access rule can express it.
