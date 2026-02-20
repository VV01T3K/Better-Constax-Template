import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const isServer = typeof window === "undefined";

export const env = createEnv({
	isServer,
	clientPrefix: "VITE_",
	server: {
		CONVEX_DEPLOYMENT: z.string().min(1).optional(),
	},
	client: {
		VITE_CONVEX_URL: z.url(),
		VITE_CONVEX_SITE_URL: z.url(),
	},
	runtimeEnvStrict: {
		CONVEX_DEPLOYMENT: isServer ? process.env.CONVEX_DEPLOYMENT : undefined,
		VITE_CONVEX_URL: import.meta.env.VITE_CONVEX_URL,
		VITE_CONVEX_SITE_URL: import.meta.env.VITE_CONVEX_SITE_URL,
	},
	emptyStringAsUndefined: true,
});
