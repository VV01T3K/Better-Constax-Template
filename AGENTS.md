## Commands

> use mise if bun is not available in the sandbox environment

```bash
bun install                          # Install dependencies
bun run dev                          # Start web + convex in parallel
bun run dev:web                      # Start web only (port 3000)
bun run dev:convex                   # Start Convex backend only
bun run build                        # Production build for web app
bun run preview                      # Preview web production output
bun run lint                         # Lint all workspaces with oxlint
bun run format                       # Format all workspaces with oxfmt
bun run check                        # Format + lint + type-check all workspaces
bun run auth:generate                # Regenerate Better Auth schema in apps/convex
bun run convex:env                   # Set Convex environment defaults
```

## Architecture

**Monorepo** with Turborepo, Bun workspaces, TanStack Start frontend (`apps/web`), and Convex backend (`apps/convex`).

### Stack

- **Monorepo**: Turborepo with package tasks (`turbo run ...` from root)
- **Frontend framework**: TanStack Start (SSR/streaming via Nitro with `bun` preset)
- **Routing**: TanStack Router — file-based routing in `apps/web/src/routes/`. Route tree auto-generated in `apps/web/src/routeTree.gen.ts` (read-only, do not edit)
- **Data layer**: Convex (real-time backend) + TanStack Query (client caching) bridged via `@convex-dev/react-query`
- **Optimistic updates**: TanStack React DB patterns in `apps/web/src/` with optimistic/confirmed/error states
- **Auth**: Better Auth with Convex adapter — server auth in `apps/web/src/lib/auth-server.ts`, client auth in `apps/web/src/lib/auth-client.ts`, Convex HTTP handler in `apps/convex/convex/http.ts` (Hono)
- **Validation**: Zod schemas in `apps/convex/convex/schemas/` shared between client and server; Convex schema derived via `zodToConvexFields`
- **Styling**: Tailwind CSS 4 via Vite plugin
- **React Compiler**: Enabled via Babel plugin (`babel-plugin-react-compiler`)

### Key directories

- `apps/web/` — TanStack Start app package
- `apps/web/src/routes/` — File-based routes. `__root.tsx` wraps app in `ConvexBetterAuthProvider`
- `apps/web/src/components/` — Shared React components
- `apps/web/src/hooks/` — Custom hooks (prefixed `demo.` files are demo code, safe to delete)
- `apps/web/src/lib/` — Auth client/server setup, middleware
- `apps/convex/` — Convex workspace package
- `apps/convex/convex/` — Convex backend source: mutations, queries, schema, HTTP routes, auth config
- `apps/convex/convex/_generated/` — Auto-generated Convex types (do not edit)
- `apps/convex/convex/betterAuth/` — Better Auth adapter and generated schema for Convex
- `packages/` — Reserved for future shared packages

### Server functions

Use `createServerFn()` from `@tanstack/react-start` for type-safe server functions. Route loaders receive `queryClient` and `convexQueryClient` via router context (defined in `apps/web/src/routes/__root.tsx`).

### Path aliases

- In `apps/web`: `@/*` resolves to `./src/*`
- In `apps/web`: `@convex/*` resolves to `../convex/convex/*`

## Code style

- **Indentation**: Tabs (tab size 3 in editor)
- **Formatting**: oxfmt handles Tailwind class sorting for `clsx`, `cn`, `cva`, `tw` functions
- **Linting**: oxlint with plugins: react, react-perf, typescript, import, unicorn, jsx-a11y, vitest, promise, oxc. TanStack Query lint rules are also enabled
- Files prefixed with `demo` are demo/example code and can be safely removed

## Error Handling with neverthrow

Use [neverthrow](https://github.com/supermacro/neverthrow) for explicit error handling in **custom business logic** — validation, transformations, and utilities where you control the failure modes.
We want to keep code clean, straightforward and readable, so don't overuse neverthrow, apply it where it adds value without unnecessary complexity.

### When to use neverthrow

✅ **Use for:**

- Custom validation functions (file type detection, data parsing)
- Business logic utilities that can fail
- Data transformation with potential errors
- Functions you own where failure is expected

❌ **Don't use for:**

- TanStack Query mutations/queries (already has error handling)
- Convex mutations/queries (already typed and handled)
- Third-party libraries that already return errors

### Pattern

```typescript
import { err, ok, type Result } from "neverthrow";

// Define specific error types
export class FileTypeError extends Error {
	constructor(
		message: string,
		public readonly cause?: unknown,
	) {
		super(message, { cause });
		this.name = "FileTypeError";
	}
}

// Return Result<T, ErrorType> from async functions
export async function detectFileType(file: File): Promise<Result<DetectedFileType, FileTypeError>> {
	try {
		const detected = await fileTypeFromBlob(file);
		if (detected) {
			return ok({ mime: detected.mime, detectedExt: detected.ext, source: "magic-bytes" });
		}
		// ... fallback logic
		return ok({
			/* ... */
		});
	} catch (cause) {
		return err(new FileTypeError("Failed to detect file type", cause));
	}
}

// Usage in components
const result = await detectFileType(file);

// Option 1: match() for exhaustive handling
result.match(
	(detected) => console.log("Type:", detected.mime),
	(error) => console.error("Failed:", error.message),
);

// Option 2: isOk() / isErr() guards
if (result.isOk()) {
	console.log("Type:", result.value.mime);
} else {
	console.error("Failed:", result.error.message);
}

// Option 3: map() / mapErr() for chaining
const validated = result
	.map((detected) => validateMimeType(detected))
	.mapErr((error) => ({ message: error.message, code: "FILE_TYPE_ERROR" }));
```

## Environment

- Web app variables live in `apps/web/.env.local`
- Convex variables live in `apps/convex/.env.local`
- Minimum required variables: `VITE_CONVEX_URL` and `CONVEX_DEPLOYMENT`
