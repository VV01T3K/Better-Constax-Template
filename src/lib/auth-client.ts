import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const baseURL =
	typeof window === "undefined"
		? (import.meta.env.VITE_SITE_URL ?? "http://localhost:3000")
		: window.location.origin;

export const authClient = createAuthClient({
	baseURL,
	fetchOptions: {
		credentials: "include",
	},
	plugins: [convexClient()],
});
