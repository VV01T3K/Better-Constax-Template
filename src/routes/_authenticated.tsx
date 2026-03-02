import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { ensureAuthIdentity } from "../integrations/convex/auth-state";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async ({ context, location }) => {
		const authIdentity = await ensureAuthIdentity(context.queryClient);

		if (!authIdentity) {
			throw redirect({
				to: "/auth",
				search: {
					redirect: location.href,
				},
			});
		}
	},
	component: () => <Outlet />,
});
