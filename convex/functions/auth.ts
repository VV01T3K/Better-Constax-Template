import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import type { BetterAuthOptions } from "better-auth";

import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";
import schema from "./betterAuth/schema";

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

export const authClient = createClient<DataModel>(components.betterAuth, {
	local: { schema },
});

const createAuthOptions = (): BetterAuthOptions => ({
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
});

export const createAuth = (ctx: GenericCtx<DataModel>) =>
	betterAuth({
		...createAuthOptions(),
		database: authClient.adapter(ctx),
	});

export const { getAuthUser } = authClient.clientApi();
export const { safeGetAuthUser, getAnyUserById, getHeaders, getAuth } = authClient;
