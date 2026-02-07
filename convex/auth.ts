import type { GenericCtx } from "@convex-dev/better-auth";
import type { BetterAuthOptions } from "better-auth";

import { createClient, type AuthFunctions } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";

import type { DataModel } from "./_generated/dataModel";

import { components, internal } from "./_generated/api";
import { query } from "./_generated/server";
import authConfig from "./auth.config";
import schema from "./betterAuth/schema";

const authFunctions: AuthFunctions = internal.auth;

export const authComponent = createClient<DataModel, typeof schema>(components.betterAuth, {
	authFunctions,
	local: {
		schema,
	},
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

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
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
		database: authComponent.adapter(ctx),
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
		plugins: [convex({ authConfig })],
		advanced: {
			defaultCookieAttributes: {
				sameSite: "none",
				secure: true,
				partitioned: true,
			},
		},
	} satisfies BetterAuthOptions;
};

export const createAuth = (ctx: GenericCtx<DataModel>) => {
	return betterAuth(createAuthOptions(ctx));
};

export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.auth.getUserIdentity();
	},
});
