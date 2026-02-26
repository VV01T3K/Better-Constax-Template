import { convex, defineAuth } from "better-convex/auth";

import authConfig from "./auth.config";
import { getSharedAuthOptions, getSiteUrl } from "./auth.shared";

// Keep this root entrypoint because better-convex codegen/runtime expects
// `convex/functions/auth.ts` to default export `defineAuth(...)`.
const siteUrl = getSiteUrl();

export default defineAuth(() => ({
	baseURL: siteUrl,
	trustedOrigins: [siteUrl],
	...getSharedAuthOptions(),
	plugins: [
		convex({
			authConfig,
			jwks: process.env.JWKS,
		}),
	],
}));
