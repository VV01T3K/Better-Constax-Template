import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const isServer = typeof window === "undefined";

export const env = createEnv({
	isServer,
	clientPrefix: "VITE_",
	server: {
		CONVEX_DEPLOYMENT: z.string().min(1).optional(),
		SITE_URL: z.string().url().optional(),
		BETTER_AUTH_SECRET: z.string().min(1).optional(),
		BETTER_AUTH_JWKS_PRIVATE_KEY: z.string().min(1).optional(),
		BETTER_AUTH_JWKS_PUBLIC_KEY: z.string().min(1).optional(),
	},
	client: {
		VITE_CONVEX_URL: z.string().url(),
		VITE_CONVEX_SITE_URL: z.string().url(),
		VITE_SITE_URL: z.string().url().optional(),
	},
	runtimeEnvStrict: {
		CONVEX_DEPLOYMENT: isServer ? process.env.CONVEX_DEPLOYMENT : undefined,
		SITE_URL: isServer ? process.env.SITE_URL : undefined,
		BETTER_AUTH_SECRET: isServer ? process.env.BETTER_AUTH_SECRET : undefined,
		BETTER_AUTH_JWKS_PRIVATE_KEY: isServer ? process.env.BETTER_AUTH_JWKS_PRIVATE_KEY : undefined,
		BETTER_AUTH_JWKS_PUBLIC_KEY: isServer ? process.env.BETTER_AUTH_JWKS_PUBLIC_KEY : undefined,
		VITE_CONVEX_URL: import.meta.env.VITE_CONVEX_URL,
		VITE_CONVEX_SITE_URL: import.meta.env.VITE_CONVEX_SITE_URL,
		VITE_SITE_URL: import.meta.env.VITE_SITE_URL,
	},
	emptyStringAsUndefined: true,
});
