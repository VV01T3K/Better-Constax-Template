# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install                          # Install dependencies
bun run dev                    # Dev server on port 3000 (with TLS bypass)
bun run build                  # Production build
bun run test                   # Run all tests (Vitest)
bun --bun vitest run src/path.test.ts  # Run a single test file
bun run lint                   # Lint with oxlint (type-aware, auto-fix)
bun run format                 # Format with oxfmt
bun run check                  # Format + lint + type-check (oxfmt, oxlint, tsgo)
npx convex dev                       # Start Convex backend dev server
bun run auth:generate                # Regenerate Better Auth schema for Convex
```

## Architecture

**Full-stack TanStack Start app** with React 19, Convex backend, and Better Auth. Uses Bun as runtime and package manager.

### Stack

- **Framework**: TanStack Start (SSR/streaming via Nitro with `bun` preset)
- **Routing**: TanStack Router — file-based routing in `src/routes/`. Route tree auto-generated in `src/routeTree.gen.ts` (read-only, do not edit)
- **Data layer**: Convex (real-time backend) + TanStack Query (client caching) bridged via `@convex-dev/react-query`
- **Optimistic updates**: TanStack React DB (`src/db-collections/`) provides local collections that sync with Convex and track status (`optimistic` | `confirmed` | `error`)
- **Auth**: Better Auth with Convex adapter — server auth in `src/lib/auth-server.ts`, client auth in `src/lib/auth-client.ts`, Convex HTTP handler in `convex/http.ts` (Hono)
- **Validation**: Zod schemas in `convex/schemas/` shared between client and server; Convex schema derived via `zodToConvexFields`
- **Styling**: Tailwind CSS 4 via Vite plugin
- **React Compiler**: Enabled via Babel plugin (`babel-plugin-react-compiler`)

### Key directories

- `src/routes/` — File-based routes. `__root.tsx` is the root layout wrapping everything in `ConvexBetterAuthProvider`
- `src/components/` — Shared React components
- `src/hooks/` — Custom hooks (prefixed `demo.` files are demo code, safe to delete)
- `src/db-collections/` — TanStack React DB collection definitions for optimistic patterns
- `src/lib/` — Auth client/server setup, middleware
- `convex/` — Convex backend: mutations, queries, schema, HTTP routes, auth config
- `convex/_generated/` — Auto-generated Convex types (do not edit)
- `convex/betterAuth/` — Better Auth adapter and generated schema for Convex

### Server functions

Use `createServerFn()` from `@tanstack/react-start` for type-safe server functions. Route loaders receive `queryClient` and `convexQueryClient` via router context (defined in `__root.tsx`).

### Path alias

`@/*` resolves to `./src/*` (configured in both `tsconfig.json` and `vite.config.ts`).

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
	constructor(
		message: string,
		public readonly cause?: unknown,
	) {
		super(message, { cause });
		this.name = "FileTypeError";
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

Requires `VITE_CONVEX_URL` and `CONVEX_DEPLOYMENT` in `.env.local` for Convex connectivity.
