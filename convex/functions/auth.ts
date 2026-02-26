import { convex, defineAuth } from "better-convex/auth";

import authConfig from "./auth.config";

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

export default defineAuth(() => ({
	baseURL: SITE_URL,
	trustedOrigins: [SITE_URL],
	emailAndPassword: {
		enabled: true,
	},
	plugins: [
		convex({
			authConfig,
		}),
	],
}));
