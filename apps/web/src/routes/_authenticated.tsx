import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import {
	getAuthRedirectSearch,
	getRedirectTargetFromRouterLocation,
} from "../integrations/convex/auth-redirect";
import { ensureAuthIdentity } from "../integrations/convex/auth-state";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async ({ context, location }) => {
		const authIdentity = await ensureAuthIdentity(context.queryClient);

		if (!authIdentity) {
			const redirectTarget = getRedirectTargetFromRouterLocation(location);

			throw redirect({
				to: "/auth",
				search: getAuthRedirectSearch(redirectTarget),
			});
		}
	},
	component: () => <Outlet />,
});
