import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import type { AppPermission } from "@convex/schemas";
import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";

type RouteGuardOptions = {
	queryClient: Pick<QueryClient, "fetchQuery">;
	redirectHref: string;
	permission?: AppPermission;
	prefetch?: () => Promise<unknown> | void;
};

export async function protectedRouteLoader(options: RouteGuardOptions): Promise<void> {
	const currentUser = await options.queryClient.fetchQuery({
		...convexQuery(api.auth.getCurrentUser, {}),
		staleTime: 0,
	});

	if (!currentUser) {
		throw redirect({
			to: "/auth/login",
			search: {
				redirect: options.redirectHref,
			},
		});
	}

	if (options.permission) {
		const allowed = await options.queryClient.fetchQuery({
			...convexQuery(api.functions.authorization.hasPermission, {
				permission: options.permission,
			}),
			staleTime: 0,
		});

		if (!allowed) {
			throw redirect({ to: "/forbidden" });
		}
	}

	await options.prefetch?.();
}
