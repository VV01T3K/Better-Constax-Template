import { zodToConvexFields } from "better-convex/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import { fileSchema, profileSchema, productSchema, todoSchema } from "../shared/schemas";

export default defineSchema({
	// App tables
	profiles: defineTable(zodToConvexFields(profileSchema.shape)).index("by_authUserId", [
		"authUserId",
	]),
	products: defineTable(zodToConvexFields(productSchema.shape)),
	todos: defineTable(zodToConvexFields(todoSchema.shape)),
	files: defineTable(zodToConvexFields(fileSchema.shape)),

	// Better Auth tables (local approach - no component)
	user: defineTable({
		name: v.string(),
		email: v.string(),
		emailVerified: v.boolean(),
		image: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
		userId: v.optional(v.string()),
	})
		.index("email", ["email"])
		.index("userId", ["userId"]),
	session: defineTable({
		expiresAt: v.number(),
		token: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
		ipAddress: v.optional(v.string()),
		userAgent: v.optional(v.string()),
		userId: v.string(),
	})
		.index("token", ["token"])
		.index("userId", ["userId"]),
	account: defineTable({
		accountId: v.string(),
		providerId: v.string(),
		userId: v.string(),
		accessToken: v.optional(v.string()),
		refreshToken: v.optional(v.string()),
		idToken: v.optional(v.string()),
		accessTokenExpiresAt: v.optional(v.number()),
		refreshTokenExpiresAt: v.optional(v.number()),
		scope: v.optional(v.string()),
		password: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("accountId", ["accountId"])
		.index("userId", ["userId"]),
	verification: defineTable({
		identifier: v.string(),
		value: v.string(),
		expiresAt: v.number(),
		createdAt: v.optional(v.number()),
		updatedAt: v.optional(v.number()),
	}).index("identifier", ["identifier"]),
	jwks: defineTable({
		publicKey: v.string(),
		privateKey: v.string(),
		createdAt: v.number(),
	}),
});
