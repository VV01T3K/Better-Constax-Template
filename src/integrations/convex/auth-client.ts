import { createAuthClient } from "better-auth/react";
import { convexClient } from "better-convex/auth/client";
import { createAuthMutations } from "better-convex/react";

import { env } from "../../env";

const serverAuthOrigin = import.meta.env.SSR
	? (env.SERVER_URL ?? "http://localhost:3000")
	: undefined;

export const authClient = createAuthClient({
	baseURL: serverAuthOrigin,
	basePath: "/api/auth",
	plugins: [convexClient()],
});

export const { useSignInMutationOptions, useSignOutMutationOptions, useSignUpMutationOptions } =
	createAuthMutations(authClient);
