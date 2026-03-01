# TanStack Form in TanStack Start: the complete guide

**TanStack Form v1 paired with TanStack Start delivers type-safe, progressively enhanced forms with server-side validation out of the box.** The integration uses a shared-options architecture where form configuration lives in an isomorphic layer, client-side fields get granular reactive validation, and server functions handle secure validation and persistence — all wired together through a `mergeForm` bridge that transfers server errors back to client fields. This guide covers every aspect of building production forms with this stack, from initial setup through advanced patterns like field arrays, async validation, and file uploads.

TanStack Form is _not_ React Hook Form. It is a headless, framework-agnostic form library built on `@tanstack/store` (a signal-based reactive store), designed for deep TypeScript inference and granular per-field re-renders. TanStack Start is TanStack's full-stack React framework built on TanStack Router and Vinxi, offering file-based routing, server functions via `createServerFn`, and SSR. The two integrate through a dedicated package — `@tanstack/react-form-start` — that provides utilities for progressive enhancement, server validation, and state hydration.

---

## Core setup and the three-layer architecture

The TanStack Form + Start integration follows a three-layer architecture: **shared configuration**, **server-side validation**, and **client-side rendering**. This separation keeps validation logic DRY while enabling both no-JS form submission and rich client-side interactions.

### Layer 1: Shared form options (isomorphic)

Define your form's shape once in a shared module. The `formOptions` helper captures `defaultValues` and any shared configuration that both client and server need:

```typescript
// app/utils/form-isomorphic.ts
import { formOptions } from "@tanstack/react-form-start";

export const formOpts = formOptions({
	defaultValues: {
		firstName: "",
		lastName: "",
		age: 0,
		email: "",
	},
});
```

TypeScript infers all field types from `defaultValues` automatically. You never pass generics manually — field names, value types, and error types flow through the entire system.

### Layer 2: Server functions for validation and submission

Server-side handling uses TanStack Start's `createServerFn` combined with `createServerValidate` and `ServerValidateError` from the form-start package:

```typescript
// app/utils/form.tsx
import { createServerFn } from "@tanstack/react-start";
import { ServerValidateError, createServerValidate, getFormData } from "@tanstack/react-form-start";
import { formOpts } from "./form-isomorphic";

const serverValidate = createServerValidate({
	...formOpts,
	onServerValidate: ({ value }) => {
		if (value.age < 12) {
			return "Server validation: You must be at least 12 to sign up";
		}
	},
});

export const handleForm = createServerFn({ method: "POST" })
	.validator((data: unknown) => {
		if (!(data instanceof FormData)) throw new Error("Invalid form data");
		return data;
	})
	.handler(async (ctx) => {
		try {
			const validatedData = await serverValidate(ctx.data);
			// Persist to database
		} catch (e) {
			// Workaround: use name check instead of instanceof (Vite SSR bug)
			if (e instanceof ServerValidateError) return e.response;
			return "Internal error";
		}
		return "Form validated successfully";
	});

export const getFormDataFromServer = createServerFn({ method: "GET" }).handler(async () =>
	getFormData(),
);
```

The `createServerValidate` function decodes incoming FormData, runs your `onServerValidate` callback, and throws a `ServerValidateError` on failure. That error's `.response` property carries the full form state (including per-field errors) back to the client.

### Layer 3: Client-side route component

The route loads server state via a loader, then merges it into the client-side form using `useTransform` and `mergeForm`:

```typescript
// app/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { mergeForm, useForm, useTransform } from '@tanstack/react-form-start'
import { useStore } from '@tanstack/react-store'
import { getFormDataFromServer, handleForm } from '~/utils/form'
import { formOpts } from '~/utils/form-isomorphic'

export const Route = createFileRoute('/')(  {
  component: Home,
  loader: async () => ({
    state: await getFormDataFromServer(),
  }),
})

function Home() {
  const { state } = Route.useLoaderData()

  const form = useForm({
    ...formOpts,
    transform: useTransform(
      (baseForm) => mergeForm(baseForm, state),
      [state],
    ),
  })

  return (
    <form action={handleForm.url} method="post" encType="multipart/form-data">
      <form.Field
        name="age"
        validators={{
          onChange: ({ value }) =>
            value < 8 ? 'Client: Must be at least 8' : undefined,
        }}
      >
        {(field) => (
          <div>
            <input
              name="age"
              type="number"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.valueAsNumber)}
            />
            {field.state.meta.errors.map((err) => (
              <p key={err as string}>{err}</p>
            ))}
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <button type="submit" disabled={!canSubmit}>
            {isSubmitting ? '...' : 'Submit'}
          </button>
        )}
      </form.Subscribe>
    </form>
  )
}
```

The `action={handleForm.url}` attribute enables **progressive enhancement** — when JavaScript is unavailable, the browser performs a native POST to the server function's URL. When JS is loaded, client-side validators run first, providing instant feedback before any network request.

---

## Zod validation on both client and server

TanStack Form v1 natively supports any library implementing the **Standard Schema specification** — including **Zod v3.24+**, Valibot, and ArkType. No adapter package is needed. The old `@tanstack/zod-form-adapter` is deprecated.

### Form-level Zod schemas with automatic field error propagation

Pass a Zod schema directly to `validators` and errors automatically propagate to matching fields:

```typescript
import { z } from "zod";

const userSchema = z.object({
	firstName: z.string().min(2, "At least 2 characters"),
	lastName: z.string().min(2, "At least 2 characters"),
	age: z.number().gte(13, "Must be 13 or older"),
	email: z.string().email("Invalid email address"),
});

const form = useForm({
	defaultValues: { firstName: "", lastName: "", age: 0, email: "" },
	validators: {
		onSubmit: userSchema, // Validates entire form on submit
		onBlur: userSchema, // Re-validates on field blur
	},
	onSubmit: async ({ value }) => {
		await saveUser(value);
	},
});
```

When `userSchema` fails, the error for `firstName` appears in the `firstName` field's `field.state.meta.errors` array — TanStack Form matches schema property names to field names automatically.

### Field-level Zod schemas

For per-field schemas with different timing:

```typescript
<form.Field
  name="email"
  validators={{
    onChange: z.string().email('Invalid email'),
    onChangeAsyncDebounceMs: 500,
    onChangeAsync: z.string().refine(
      async (val) => {
        const available = await checkEmailAvailability(val)
        return available
      },
      { message: 'Email already registered' },
    ),
  }}
>
  {(field) => (/* ... */)}
</form.Field>
```

Sync validators run first. **Async validators only execute if sync validation passes**, preventing unnecessary server calls.

### Server-side Zod validation

Combine Zod with `onServerValidate` for server-only checks:

```typescript
const serverValidate = createServerValidate({
	...formOpts,
	onServerValidate: ({ value }) => {
		// Server-only validation: check database constraints, rate limits, etc.
		const parsed = userSchema.safeParse(value);
		if (!parsed.success) {
			return parsed.error.issues.map((i) => i.message).join(", ");
		}
	},
});
```

**Important caveat**: TanStack Form does **not** preserve Zod's transformed output. If your schema uses `.transform()`, the `onSubmit` handler receives the raw `defaultValues`-shaped data, not the transformed output. Handle transforms explicitly in your submission logic.

---

## Field validation strategies and error display

TanStack Form offers five validation timing options at both field and form level, plus async variants with debouncing.

### Validation timing matrix

| Trigger     | Sync        | Async            | Use case                           |
| ----------- | ----------- | ---------------- | ---------------------------------- |
| `onChange`  | `onChange`  | `onChangeAsync`  | Instant feedback during typing     |
| `onBlur`    | `onBlur`    | `onBlurAsync`    | Validate after user leaves field   |
| `onSubmit`  | `onSubmit`  | `onSubmitAsync`  | Final validation before submission |
| `onMount`   | `onMount`   | —                | Validate initial/prefilled values  |
| `onDynamic` | `onDynamic` | `onDynamicAsync` | Rules change based on form state   |

Async validators accept `asyncDebounceMs` (field-level default) and per-validator overrides like `onChangeAsyncDebounceMs`:

```typescript
<form.Field
  name="username"
  asyncDebounceMs={300}
  validators={{
    onChange: ({ value }) => (!value ? 'Required' : undefined),
    onChangeAsyncDebounceMs: 800,
    onChangeAsync: async ({ value }) => {
      const taken = await checkUsername(value)
      return taken ? 'Username taken' : undefined
    },
  }}
/>
```

### Error display patterns

Each field exposes errors in two formats — a flat array and a map keyed by trigger:

```typescript
{(field) => (
  <div>
    <input /* ... */ />
    {/* Show all errors */}
    {field.state.meta.errors.length > 0 && (
      <span className="error">{field.state.meta.errors.join(', ')}</span>
    )}

    {/* Show errors by trigger for fine-grained UX */}
    {field.state.meta.errorMap['onChange'] && (
      <span className="warning">{field.state.meta.errorMap['onChange']}</span>
    )}
    {field.state.meta.errorMap['onSubmit'] && (
      <span className="error">{field.state.meta.errorMap['onSubmit']}</span>
    )}
  </div>
)}
```

Validators can return **any type**, not just strings. This enables structured error objects for complex UIs:

```typescript
validators={{
  onChange: ({ value }) =>
    value < 13 ? { code: 'AGE_MINIMUM', threshold: 13 } : undefined,
}}
// Access: field.state.meta.errorMap['onChange']?.code
```

### Dynamic validation with `revalidateLogic`

For forms that should validate loosely at first but strictly after the first submission attempt:

```typescript
import { revalidateLogic, useForm } from "@tanstack/react-form";

const form = useForm({
	defaultValues: { firstName: "" },
	validationLogic: revalidateLogic({
		mode: "submit", // Only validate on submit initially
		modeAfterSubmission: "blur", // After first submit, validate on blur
	}),
	validators: {
		onDynamic: ({ value }) => {
			if (!value.firstName) return "First name is required";
			return undefined;
		},
	},
});
```

---

## Error handling and submission patterns

### Basic submission flow

Always prevent default browser behavior and call `form.handleSubmit()`:

```typescript
<form onSubmit={(e) => {
  e.preventDefault()
  e.stopPropagation()
  form.handleSubmit()
}}>
```

### Submission with metadata for multi-action forms

TanStack Form supports typed submission metadata for forms with multiple actions (save draft, publish, continue):

```typescript
type SubmitMeta = { action: 'draft' | 'publish' | 'continue' }

const form = useForm({
  defaultValues: { title: '', body: '' },
  onSubmitMeta: { action: 'draft' } as SubmitMeta,
  onSubmit: async ({ value, meta }) => {
    if (meta.action === 'publish') await publishPost(value)
    else await saveDraft(value)
  },
})

// In JSX:
<button onClick={() => form.handleSubmit({ action: 'draft' })}>Save Draft</button>
<button onClick={() => form.handleSubmit({ action: 'publish' })}>Publish</button>
```

### Server error propagation flow

The full error flow between client and server works as follows. On initial load, the route loader calls `getFormDataFromServer()` which returns the default form state. On form submission, the native POST hits the `handleForm` server function. Server validation runs via `serverValidate(formData)`. If validation fails, `ServerValidateError` is caught and `e.response` is returned — this response contains the full form state with error maps. The client's `useTransform` + `mergeForm` pipeline merges these server errors into the client form state. Field-level errors then appear via `field.state.meta.errors` and form-level errors via `useStore(form.store, (s) => s.errors)`.

### SPA-style alternative (skip progressive enhancement)

For applications that don't need no-JS fallback, a simpler pattern avoids the entire `createServerValidate`/`mergeForm` pipeline:

```typescript
import { useMutation } from '@tanstack/react-query'

const submitMutation = useMutation({
  mutationFn: (value) => submitFormServerFn({ data: value }),
})

const form = useForm({
  defaultValues: { name: '', email: '' },
  validators: { onChange: formSchema },
  onSubmit: async ({ value, formApi }) => {
    await submitMutation.mutateAsync(value)
    formApi.reset()
  },
})

<form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
  {/* fields */}
</form>
```

**When using TanStack Query**, always use `mutateAsync` (not `mutate`) inside `onSubmit` so that TanStack Form correctly tracks the `isSubmitting` state through the returned promise.

---

## Type-safe forms need zero manual generics

TanStack Form's TypeScript integration is built on a design principle: **you should not need to distinguish between JavaScript and TypeScript usage.** Types are inferred everywhere from runtime defaults.

The `defaultValues` object serves as the single source of truth. Field names are constrained to valid `DeepKeys<T>` paths, field values resolve to the correct `DeepValue<T, K>` type, and validator return types flow through to error maps. For nested objects, bracket notation like `"people[0].name"` is fully typed.

```typescript
interface FormValues {
  user: {
    name: string
    addresses: Array<{ street: string; city: string }>
  }
}

const form = useForm({
  defaultValues: {
    user: { name: '', addresses: [{ street: '', city: '' }] },
  } satisfies FormValues,
  onSubmit: async ({ value }) => {
    // value is fully typed as FormValues
  },
})

// Type-safe nested field access:
<form.Field name="user.addresses[0].street">
  {(field) => (
    // field.state.value is string
    <input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
  )}
</form.Field>
```

The `formOptions` helper preserves types across module boundaries, so shared configuration between client and server maintains full inference without explicit type parameters.

---

## Developer experience through form composition

Out of the box, TanStack Form requires more code per field than libraries like React Hook Form. The v1 answer to this is the **`createFormHook` composition API** — a factory pattern that lets you build a library of typed, reusable field components used across your entire application.

### Setting up an app-wide form hook

```typescript
// app/lib/form.ts
import { createFormHook, createFormHookContexts } from '@tanstack/react-form'

const { fieldContext, formContext, useFieldContext } = createFormHookContexts()

// Reusable field components
function TextField({ label }: { label: string }) {
  const field = useFieldContext<string>()
  return (
    <label>
      <span>{label}</span>
      <input
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.errors.length > 0 && (
        <span className="error">{field.state.meta.errors.join(', ')}</span>
      )}
    </label>
  )
}

function NumberField({ label, min, max }: { label: string; min?: number; max?: number }) {
  const field = useFieldContext<number>()
  return (
    <label>
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.valueAsNumber)}
      />
    </label>
  )
}

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: { TextField, NumberField },
  formComponents: {},
  fieldContext,
  formContext,
})
```

### Using the composed form

Once set up, forms become dramatically more concise:

```typescript
function ProfilePage() {
  const form = useAppForm({
    defaultValues: { username: '', age: 0 },
    validators: {
      onChange: z.object({
        username: z.string().min(3, 'Min 3 chars'),
        age: z.number().gte(13, 'Must be 13+'),
      }),
    },
    onSubmit: async ({ value }) => { /* ... */ },
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
      <form.AppField name="username" children={(f) => <f.TextField label="Username" />} />
      <form.AppField name="age" children={(f) => <f.NumberField label="Age" min={0} />} />
      <button type="submit">Save</button>
    </form>
  )
}
```

### Decomposing large forms with `withForm`

For forms with many sections, `withForm` creates type-safe sub-components:

```typescript
const AddressSection = withForm({
  defaultValues: { street: '', city: '', zipCode: '' },
  render: function Render({ form }) {
    return (
      <fieldset>
        <form.AppField name="street" children={(f) => <f.TextField label="Street" />} />
        <form.AppField name="city" children={(f) => <f.TextField label="City" />} />
        <form.AppField name="zipCode" children={(f) => <f.TextField label="ZIP" />} />
      </fieldset>
    )
  },
})
```

Field components can be **lazy-loaded** via `React.lazy()` for bundle splitting in large applications. TanStack Form also integrates with **shadcn/ui**, which has official first-party TanStack Form support.

---

## Performance: signal-based reactivity by default

TanStack Form's performance model differs fundamentally from React Hook Form. It uses `@tanstack/store`, a signal-based reactive store, which means **each field only re-renders when its own state changes**. Changing the `firstName` field does not cause `lastName` to re-render.

The form instance itself is a **static class instance** — it is not reactive by default. This means passing the form through React context does not trigger re-renders. You must explicitly subscribe to values you want to react to.

**Three subscription mechanisms exist**, each optimized for different use cases:

- **`form.Field` render prop**: Only re-renders when that specific field's state changes. This is the primary mechanism and handles most cases.
- **`form.Subscribe`**: A component for subscribing to derived form state like `canSubmit` or `isSubmitting`. Always provide a `selector` function to minimize re-renders.
- **`useStore(form.store, selector)`**: A hook for accessing form values in component logic. **Always provide a selector** — calling `useStore(form.store)` without one subscribes to the entire store and defeats the purpose.

```typescript
// GOOD: granular subscription
const firstName = useStore(form.store, (s) => s.values.firstName);

// BAD: subscribes to everything
const store = useStore(form.store); // Causes re-renders on any state change
```

**One known performance issue**: using a Zod schema as a form-level `onChange` validator can trigger re-renders across all fields because the entire schema is re-evaluated on every keystroke. For `onChange` timing, prefer **field-level validators** or custom functions. Reserve form-level Zod schemas for `onSubmit` or `onBlur` timing where the performance impact is negligible.

For **array fields**, using `mode="array"` on the parent field ensures it only re-renders when the array length changes, not when individual child properties update.

---

## Advanced features worth knowing

### Linked and dependent fields

The `onChangeListenTo` and `onBlurListenTo` arrays tell a field to re-run its validators when a different field changes. This is essential for password confirmation, conditional required fields, and calculated values:

```typescript
<form.Field name="password">
  {(field) => <input type="password" /* ... */ />}
</form.Field>

<form.Field
  name="confirmPassword"
  validators={{
    onChangeListenTo: ['password'],
    onChange: ({ value, fieldApi }) => {
      if (value !== fieldApi.form.getFieldValue('password')) {
        return 'Passwords do not match'
      }
      return undefined
    },
  }}
>
  {(field) => <input type="password" /* ... */ />}
</form.Field>
```

### Listeners for side effects

Listeners react to field changes without affecting validation. They are the correct place for cascading resets, auto-save logic, and analytics:

```typescript
<form.Field
  name="country"
  listeners={{
    onChange: ({ value }) => {
      form.setFieldValue('province', '') // Reset province when country changes
    },
  }}
/>
```

Form-level listeners enable patterns like auto-save:

```typescript
const form = useForm({
	listeners: {
		onChangeDebounceMs: 2000,
		onChange: ({ formApi }) => {
			if (formApi.state.isValid) formApi.handleSubmit();
		},
	},
});
```

### Field arrays for dynamic lists

Use `mode="array"` on the parent field to unlock array manipulation methods:

```typescript
<form.Field name="hobbies" mode="array">
  {(field) => (
    <div>
      {field.state.value.map((_, i) => (
        <form.Field key={i} name={`hobbies[${i}].name`}>
          {(subField) => (
            <div>
              <input
                value={subField.state.value}
                onChange={(e) => subField.handleChange(e.target.value)}
              />
              <button type="button" onClick={() => field.removeValue(i)}>Remove</button>
            </div>
          )}
        </form.Field>
      ))}
      <button type="button" onClick={() => field.pushValue({ name: '' })}>
        Add Hobby
      </button>
    </div>
  )}
</form.Field>
```

Available array operations: **`pushValue`**, **`removeValue`**, `insertValue`, `replaceValue`, `swapValues`, `moveValue`, and `clearValues`.

### File uploads

The progressive enhancement pattern uses `encType="multipart/form-data"` on the form element, and server functions receive FormData including file references. However, TanStack Start currently **loads the entire file into memory** before the handler executes — there is no streaming upload support yet. For large files, the community recommends using **UploadThing** (which has an official TanStack Start guide), direct-to-cloud uploads via presigned URLs (S3, Cloudflare R2), or client-side size validation before submission to prevent memory issues.

---

## Routing integration and form state lifecycle

TanStack Form integrates with TanStack Start's routing through the loader → render → action cycle. The route's `loader` function calls `getFormDataFromServer()` to hydrate the initial form state. The `useTransform` hook in the component merges any server state (including post-submission validation errors) into the client-side form via `mergeForm`. Server functions expose a `.url` property that serves as the HTML form action for progressive enhancement.

Route search params can complement forms for pre-filling. While not part of the official TanStack Form integration, you can pull values from the route and feed them into `defaultValues`:

```typescript
export const Route = createFileRoute("/register")({
	validateSearch: z.object({ email: z.string().optional() }),
	component: RegisterForm,
	loader: async () => ({ state: await getFormDataFromServer() }),
});

function RegisterForm() {
	const { email } = Route.useSearch();
	const form = useForm({
		defaultValues: { email: email ?? "", name: "" },
		// ...
	});
}
```

---

## Conclusion

TanStack Form in TanStack Start represents a deliberately different trade-off than simpler form libraries. It demands more upfront setup — the three-layer architecture, `createFormHook` composition, and explicit subscription model all require intentional design. The payoff is **granular reactivity that scales** (no whole-form re-renders), **native Zod integration without adapters**, **progressive enhancement for free**, and **type safety that flows from `defaultValues` through server validation and back**.

Three practical recommendations stand out. First, invest early in `createFormHook` and build a reusable field component library — this eliminates the verbosity problem entirely. Second, use form-level Zod schemas for `onSubmit` validation but field-level custom functions for `onChange` to avoid the re-render issue with schema-based onChange validators. Third, for most applications, the simpler SPA-style pattern (calling server functions directly from `onSubmit` with TanStack Query) provides a better developer experience than the full progressive enhancement pipeline, unless no-JS support is a genuine requirement. The `createServerValidate`/`mergeForm` flow has known rough edges — including the `instanceof ServerValidateError` bug in Vite SSR and awkward navigation on success — that make it more suited to specific progressive enhancement needs than general-purpose use.
