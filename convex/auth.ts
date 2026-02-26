import { betterAuth, type BetterAuthOptions } from "better-auth";
import { convex, createApi, createClient, type AuthFunctions } from "better-convex/auth";

import authConfig from "./auth.config";
import { internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";
import schema from "./schema";

type BetterAuthCtx = QueryCtx | MutationCtx | ActionCtx;

const authFunctions: AuthFunctions = internal.auth;

const authClient = createClient<DataModel, typeof schema>({
	authFunctions,
	schema,
});

const getBaseUrl = () => process.env.SITE_URL ?? process.env.VITE_SITE_URL ?? "http://localhost:3000";

export const getAuthOptions = (ctx: BetterAuthCtx) =>
	({
		appName: "Better Constax Template",
		baseURL: getBaseUrl(),
		database: authClient.adapter(ctx, getAuthOptions),
		emailAndPassword: {
			enabled: true,
		},
		session: {
			expiresIn: 60 * 60 * 24 * 30,
			updateAge: 60 * 60 * 24,
		},
		plugins: [
			convex({
				authConfig,
				jwks: process.env.BETTER_AUTH_JWKS_PRIVATE_KEY,
			}),
		],
	} satisfies BetterAuthOptions);

export const getAuth = (ctx: BetterAuthCtx) => betterAuth(getAuthOptions(ctx));

export const {
	createAccount,
	deleteAccount,
	updateUser,
	deleteUser,
	createVerification,
	deleteVerification,
	useVerification,
	createSession,
	findSession,
	deleteSession,
	updateSession,
} = createApi(schema, getAuth, { skipValidation: true });

export const auth = betterAuth(getAuthOptions({} as BetterAuthCtx));
