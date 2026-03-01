import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { getServerIsAuthenticated } from "../integrations/convex/server-fn";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async ({ context, location }) => {
		const isAuthenticated =
			typeof context.isAuthenticated === "boolean"
				? context.isAuthenticated
				: await getServerIsAuthenticated();

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
