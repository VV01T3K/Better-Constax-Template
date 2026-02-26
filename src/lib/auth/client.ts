import { createAuthMutations } from "better-convex/react";
import { convexClient } from "better-convex/auth-client";
import { createAuthClient } from "better-auth/react";

import { env } from "@/env";

const getBaseUrl = () => {
	if (env.VITE_SITE_URL) {
		return env.VITE_SITE_URL;
	}
	if (typeof window !== "undefined") {
		return window.location.origin;
	}
	return "http://localhost:3000";
};

export const authClient = createAuthClient({
	baseURL: getBaseUrl(),
	plugins: [convexClient()],
});

export const { useSignInMutationOptions, useSignOutMutationOptions, useSignUpMutationOptions } =
	createAuthMutations(authClient);
