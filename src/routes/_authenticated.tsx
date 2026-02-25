import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async ({ context, location }) => {
		const currentUser = await context.queryClient.fetchQuery({
			...convexQuery(api.auth.getCurrentUser, {}),
			staleTime: 0,
		});
		if (!currentUser) {
			throw redirect({
				to: "/auth/login",
				search: { redirect: location.href },
			});
		}
		return { currentUser };
	},
	component: () => <Outlet />,
});
