import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		VITE_CONVEX_URL: z.url(),
		VITE_CONVEX_SITE_URL: z.url(),
		NITRO_PRESET: z.string().optional(),
	},
	runtimeEnv: process.env,
});
