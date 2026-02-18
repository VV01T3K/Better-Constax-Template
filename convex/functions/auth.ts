import "../lib/http-polyfills";
import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth/minimal";
import { type AuthFunctions, convex, createApi, createClient } from "better-convex/auth";
import type { GenericCtx } from "better-convex/server";

import { internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";
import schema from "./schema";

const authFunctions: AuthFunctions = internal.auth;

export const authClient = createClient<DataModel, typeof schema>({
	authFunctions,
	schema,
	triggers: {
		user: {
			onCreate: async (ctx, doc) => {
				await ctx.db.insert("profiles", {
					authUserId: doc._id,
					name: doc.name,
					email: doc.email,
					image: doc.image ?? null,
					createdAt: Date.now(),
				});
			},
		},
	},
});

const getAuthOptions = (ctx: GenericCtx<DataModel>) => {
	return {
		appName: "My TanStack App",
		baseURL: process.env.SITE_URL,
		trustedOrigins: [
			process.env.SITE_URL,
			...(process.env.NODE_ENV !== "production"
				? ["http://localhost:3000", "http://127.0.0.1:3000"]
				: []),
		].filter((value): value is string => Boolean(value)),
		secret: process.env.BETTER_AUTH_SECRET,
		database: authClient.adapter(ctx, getAuthOptions),
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
		},
		session: {
			cookieCache: {
				enabled: true,
				maxAge: 5 * 60, // 5 minutes
			},
		},
		telemetry: {
			enabled: false,
		},
		plugins: [
			convex({
				authConfig,
				jwks: process.env.JWKS,
			}),
		],
		advanced: {
			defaultCookieAttributes: {
				sameSite: "none",
				secure: true,
				partitioned: true,
			},
		},
	} satisfies BetterAuthOptions;
};

export const getAuth = (ctx: GenericCtx<DataModel>) => {
	return betterAuth(getAuthOptions(ctx));
};

// Export CRUD functions for Better Auth adapter
export const { create, deleteMany, deleteOne, findMany, findOne, updateMany, updateOne } =
	createApi(schema, getAuth, {
		skipValidation: true,
	});

// Export trigger handlers
export const { beforeCreate, beforeDelete, beforeUpdate, onCreate, onDelete, onUpdate } =
	authClient.triggersApi();

export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.auth.getUserIdentity();
	},
});

// Required for Better Auth CLI schema generation
// biome-ignore lint/suspicious/noExplicitAny: Required for CLI
// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
export const auth = betterAuth(getAuthOptions({} as any));
