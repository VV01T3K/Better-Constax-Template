# Forms Architecture (SPA, Schema-First)

## Current decision

- Submission model: SPA only (`onSubmit` + mutation calls).
- Validation source of truth: shared Zod schemas in `convex/shared/schemas/*`.
- Progressive enhancement (`@tanstack/react-form-start`) is intentionally out of scope.

## Reusable form layer

The reusable form primitives now live in `src/features/forms/`:

- `createSchemaForm`: standard TanStack Form config from a Zod schema.
- `normalizeFormError`: normalizes unknown errors into a stable shape.
- `FieldControl`: headless value/change/blur binding for controls.
- `FieldMessage`: first-error rendering.
- `SubmitState`: pending and submit-error rendering.
- `FormSubmitState`: shared submit-state contract.

This layer is intentionally styling-agnostic so shadcn UI wrappers can be introduced without changing form business logic.

## Auth migration contract (no behavior change yet)

### Target schemas

- `signInSchema` and `signUpSchema` from `convex/shared/schemas/auth.ts`.

### Target form interface

Auth forms should adopt the same interface used by todos:

1. Build the form via `createSchemaForm({ schema, defaultValues, onSubmit })`.
2. Keep submit-level state as:
   - `formMessage: string | null`
   - `fieldErrors?: Record<string, string[]>`
   - `isSubmitting: boolean`
3. Normalize unknown mutation errors using `normalizeFormError`.
4. Render field errors with `FieldMessage` and submit errors/pending with `SubmitState`.

### Routing and auth semantics

Auth route behavior must remain unchanged:

- Same redirect handling based on `search.redirect`.
- Same post-success cache invalidation and router navigation.
- Same Better Auth mutation endpoints (`sign-in`, `sign-up`) and payload semantics.

## Notes for shadcn adoption

When introducing shadcn later:

- Replace current input/button rendering with shadcn components.
- Keep `createSchemaForm` and error normalization as the behavior layer.
- Preserve `FormSubmitState` contract to avoid route-specific error handling drift.
