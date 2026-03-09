import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { sanitizeRedirectTarget } from "../integrations/convex/auth-redirect";
import { ensureAuthIdentity } from "../integrations/convex/auth-state";

export const Route = createFileRoute("/auth")({
	beforeLoad: async ({ context, search }) => {
		const redirectTo = sanitizeRedirectTarget((search as Record<string, unknown>).redirect);
		const authIdentity = await ensureAuthIdentity(context.queryClient);
		if (authIdentity) {
			throw redirect({ href: redirectTo });
		}
	},
	component: () => <Outlet />,
});
