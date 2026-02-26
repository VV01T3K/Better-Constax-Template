import { convexAdapter } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";

import { getSharedAuthOptions, getSiteUrl } from "./auth.shared";

// This file exists only for `@better-auth/cli generate`.
// The runtime auth contract remains in `./auth.ts`.
// Keep options sourced from `./auth.shared` to avoid drift.
export const auth = betterAuth({
	baseURL: getSiteUrl(),
	// oxlint-disable-next-line no-unsafe-type-assertion
	database: convexAdapter({} as never, {} as never),
	...getSharedAuthOptions(),
	plugins: [
		convex({
			authConfig: {
				providers: [{ applicationID: "convex", domain: "" }],
			},
		}),
	],
});

export default auth;
