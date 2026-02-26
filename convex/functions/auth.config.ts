import { getAuthConfigProvider } from "better-convex/auth/config";
import type { AuthConfig } from "convex/server";

export default {
	providers: [getAuthConfigProvider()],
} satisfies AuthConfig;
