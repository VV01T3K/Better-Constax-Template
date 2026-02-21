import type { GenericCtx } from "@convex-dev/better-auth";
import { createClient, type AuthFunctions } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth/minimal";
import { admin } from "better-auth/plugins/admin";
import { adminAc, userAc } from "better-auth/plugins/admin/access";

import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";
import schema from "./betterAuth/schema";
import { getRoleClaimValue } from "./lib/authIdentity";
import { normalizeRole } from "./schemas";

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

function getAdminEmailAllowlist() {
	return new Set(
		(process.env.BETTER_AUTH_ADMIN_EMAILS ?? "")
			.split(",")
			.map((email) => email.trim().toLowerCase())
			.filter((email) => email.length > 0),
	);
}

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
	const adminEmailAllowlist = getAdminEmailAllowlist();

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
		plugins: [
			admin({
				defaultRole: "user",
				adminRoles: ["admin"],
				roles: {
					admin: adminAc,
					manager: userAc,
					user: userAc,
				},
				allowImpersonatingAdmins: false,
				impersonationSessionDuration: 15 * 60,
			}),
			convex({ authConfig }),
		],
		databaseHooks: {
			user: {
				create: {
					before: async (user) => {
						const email = typeof user.email === "string" ? user.email.toLowerCase() : "";
						const role = adminEmailAllowlist.has(email)
							? "admin"
							: normalizeRole("role" in user ? user.role : undefined);
						return {
							data: {
								...user,
								role,
							},
						};
					},
				},
			},
			session: {
				create: {
					before: async (session, hookCtx) => {
						if (!hookCtx) {
							return;
						}

						const user = await hookCtx.context.internalAdapter.findUserById(session.userId);
						if (!user?.email) {
							return;
						}

						const email = user.email.toLowerCase();
						if (!adminEmailAllowlist.has(email)) {
							return;
						}

						const existingRole = getRoleClaimValue(user);
						const role = normalizeRole(existingRole);
						if (role !== "admin") {
							await hookCtx.context.internalAdapter.updateUser(session.userId, {
								role: "admin",
							});
						}
					},
				},
			},
		},
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
