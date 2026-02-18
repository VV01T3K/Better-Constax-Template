import { createAuthClient } from "better-auth/react";
import { convexClient } from "better-convex/auth-client";

import { env } from "@/env/client";

export const authClient = createAuthClient({
	baseURL: env.VITE_CONVEX_SITE_URL,
	fetchOptions: {
		credentials: "include",
	},
	plugins: [convexClient()],
});
