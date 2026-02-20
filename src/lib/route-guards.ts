import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import type { AppPermission } from "@convex/schemas";
import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";

export async function requireRoutePermission(options: {
	queryClient: QueryClient;
	permission: AppPermission;
	redirectHref: string;
}) {
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
