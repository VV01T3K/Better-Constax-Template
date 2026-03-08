import { createAuthClient } from "better-auth/react";
import { convexClient } from "better-convex/auth/client";
import { createAuthMutations } from "better-convex/react";

export const authClient = createAuthClient({
	basePath: "/api/auth",
	fetchOptions: {
		credentials: "include",
	},
	sessionOptions: {
		refetchOnWindowFocus: false,
	},
	plugins: [convexClient()],
});

export const { useSignInMutationOptions, useSignOutMutationOptions, useSignUpMutationOptions } =
	createAuthMutations(authClient);
