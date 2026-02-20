import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { env } from "@/env";

export const authClient = createAuthClient({
	baseURL: env.VITE_CONVEX_SITE_URL,
	fetchOptions: {
		credentials: "include",
	},
	plugins: [convexClient()],
});
