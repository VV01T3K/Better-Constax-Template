import type { QueryClient } from "@tanstack/react-query";
import { isRedirect } from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";

import { protectedRouteLoader, protectedRouteLoaderWithPrefetch } from "./route-guard-kit";

function makeQueryClient(fetchQuery: QueryClient["fetchQuery"]): Pick<QueryClient, "fetchQuery"> {
	return {
		fetchQuery,
	};
}

async function captureRejection(promise: Promise<void>): Promise<unknown> {
	try {
		await promise;
		return new Error("Expected promise rejection");
	} catch (error) {
		return error;
	}
}

function assertRedirectError(
	error: unknown,
): asserts error is { options: { to?: string; search?: unknown } } {
	expect(isRedirect(error)).toBe(true);
}

describe("route-guard-kit", () => {
	it("redirects to login when unauthenticated", async () => {
		const queryClient = makeQueryClient(vi.fn().mockResolvedValueOnce(null));

		const error = await captureRejection(
			protectedRouteLoader({
				queryClient,
				redirectHref: "/admin/users",
				permission: "admin.users.access",
			}),
		);

		assertRedirectError(error);
		expect(error.options.to).toBe("/auth/login");
		expect(error.options.search).toEqual({ redirect: "/admin/users" });
	});

	it("redirects to forbidden when permission is denied", async () => {
		const queryClient = makeQueryClient(
			vi.fn().mockResolvedValueOnce({ subject: "user-1" }).mockResolvedValueOnce(false),
		);

		const error = await captureRejection(
			protectedRouteLoader({
				queryClient,
				redirectHref: "/admin/users",
				permission: "admin.users.access",
			}),
		);

		assertRedirectError(error);
		expect(error.options.to).toBe("/forbidden");
	});

	it("allows access and runs prefetch callback when authorized", async () => {
		const prefetch = vi.fn().mockResolvedValue(undefined);
		const queryClient = makeQueryClient(
			vi.fn().mockResolvedValueOnce({ subject: "user-1" }).mockResolvedValueOnce(true),
		);

		await protectedRouteLoaderWithPrefetch({
			queryClient,
			redirectHref: "/admin/users",
			permission: "admin.users.access",
			prefetch,
		});

		expect(prefetch).toHaveBeenCalledTimes(1);
	});
});
