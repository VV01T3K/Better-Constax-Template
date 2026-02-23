import { convexClient } from "@convex-dev/better-auth/client/plugins";
import type { auth } from "@repo/backend/convex/betterAuth/auth";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	fetchOptions: {
		credentials: "include",
	},
	plugins: [adminClient(), inferAdditionalFields<typeof auth>(), convexClient()],
});

export type AuthSession = typeof authClient.$Infer.Session;
