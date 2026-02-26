import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import {
	addressSubmissionTableFields,
	fileTableFields,
	todoTableFields,
} from "./lib/schemaAdapters";

export default defineSchema({
	// App tables
	todos: defineTable(todoTableFields).index("by_owner", ["ownerUserId"]),
	files: defineTable(fileTableFields).index("by_owner", ["ownerUserId"]),
	addressSubmissions: defineTable(addressSubmissionTableFields)
		.index("by_owner", ["ownerUserId"])
		.index("by_submitted_at", ["submittedAt"]),

	// Better Auth tables
	user: defineTable({
		name: v.optional(v.string()),
		email: v.string(),
		emailVerified: v.boolean(),
		image: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_email", ["email"]),

	session: defineTable({
		expiresAt: v.number(),
		token: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
		ipAddress: v.optional(v.string()),
		userAgent: v.optional(v.string()),
		userId: v.id("user"),
	}).index("by_token", ["token"])
		.index("by_user", ["userId"]),

	account: defineTable({
		accountId: v.string(),
		providerId: v.string(),
		userId: v.id("user"),
		accessToken: v.optional(v.string()),
		refreshToken: v.optional(v.string()),
		idToken: v.optional(v.string()),
		accessTokenExpiresAt: v.optional(v.number()),
		refreshTokenExpiresAt: v.optional(v.number()),
		scope: v.optional(v.string()),
		password: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_user", ["userId"])
		.index("by_provider_and_account", ["providerId", "accountId"]),

	verification: defineTable({
		identifier: v.string(),
		value: v.string(),
		expiresAt: v.number(),
		createdAt: v.optional(v.number()),
		updatedAt: v.optional(v.number()),
	}).index("by_identifier", ["identifier"]),
});
