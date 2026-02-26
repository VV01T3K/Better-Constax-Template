import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import { tables as betterAuthTables } from "./betterAuth/schema";

export default defineSchema({
	...betterAuthTables,
	products: defineTable({
		title: v.string(),
		imageId: v.string(),
		price: v.number(),
	}),
	todos: defineTable({
		text: v.string(),
		completed: v.boolean(),
		userId: v.string(),
	}).index("by_user", ["userId"]),
});
