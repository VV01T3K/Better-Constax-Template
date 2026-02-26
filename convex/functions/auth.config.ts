import { getAuthConfigProvider } from "better-convex/auth/config";
import type { AuthConfig } from "convex/server";

// Kept as a dedicated root auth config file because Convex reads this module
// as the auth provider contract for JWT verification.
export default {
	providers: [getAuthConfigProvider({ jwks: process.env.JWKS })],
} satisfies AuthConfig;
