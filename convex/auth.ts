import { betterAuth } from "better-auth/minimal";
import {
	createClient,
	type AuthFunctions,
} from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import type { GenericCtx } from "@convex-dev/better-auth";
import type { BetterAuthOptions } from "better-auth";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";
import schema from "./betterAuth/schema";

const authFunctions: AuthFunctions = internal.auth;

export const authComponent = createClient<DataModel, typeof schema>(
	components.betterAuth,
	{
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
	},
);

export const { onCreate, onUpdate, onDelete } =
	authComponent.triggersApi();

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
	return {
		appName: "My TanStack App",
		baseURL: process.env.SITE_URL,
		secret: process.env.BETTER_AUTH_SECRET,
		database: authComponent.adapter(ctx),
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
		},
		plugins: [convex({ authConfig })],
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
