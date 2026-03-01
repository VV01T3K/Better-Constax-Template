import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { getServerAuthState } from "../integrations/convex/server-fn";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async ({ location }) => {
		const { isAuthenticated } = await getServerAuthState();

		if (!isAuthenticated) {
			throw redirect({
				to: "/auth",
				search: {
					redirect: location.href,
				},
			});
		}
	},
	component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
	return <Outlet />;
}
