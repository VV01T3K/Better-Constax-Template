import { defineSchema, defineTable } from "convex/server";
import { zodToConvexFields } from "convex-helpers/server/zod4";
import { profileSchema, productSchema, todoSchema } from "./schemas";

export default defineSchema({
	profiles: defineTable(
		zodToConvexFields(profileSchema.shape),
	).index("by_authUserId", ["authUserId"]),
	products: defineTable(zodToConvexFields(productSchema.shape)),
	todos: defineTable(zodToConvexFields(todoSchema.shape)),
});
