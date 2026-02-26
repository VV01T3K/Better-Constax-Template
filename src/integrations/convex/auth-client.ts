import { createAuthClient } from "better-auth/react";
import { convexClient } from "better-convex/auth/client";
import { createAuthMutations } from "better-convex/react";

import { env } from "../../env";

const baseURL = typeof window === "undefined" ? env.VITE_SITE_URL : window.location.origin;

export const authClient = createAuthClient({
	baseURL,
	basePath: "/api/auth",
	sessionOptions: {
		refetchOnWindowFocus: false,
	},
	plugins: [convexClient()],
});

export const { useSignInMutationOptions, useSignOutMutationOptions, useSignUpMutationOptions } =
	createAuthMutations(authClient);
