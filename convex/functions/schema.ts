import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Auth tables are CLI-generated in `./authSchema.ts`; app tables stay here.
import { tables as authSchema } from "./authSchema";

export default defineSchema({
	...authSchema,
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
