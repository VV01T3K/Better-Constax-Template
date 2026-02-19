import { zodToConvexFields } from "convex-helpers/server/zod4";
import { defineSchema, defineTable } from "convex/server";

import { eventSchema, profileSchema, todoSchema } from "./schemas";

export default defineSchema({
	profiles: defineTable(zodToConvexFields(profileSchema.shape)).index("by_authUserId", [
		"authUserId",
	]),
	todos: defineTable(zodToConvexFields(todoSchema.shape)),
	events: defineTable(zodToConvexFields(eventSchema.shape))
		.index("by_user_created", ["userId", "createdAt"])
		.index("by_user_archived_created", ["userId", "archived", "createdAt"]),
});
