import { zodToConvexFields } from "convex-helpers/server/zod4";
import { defineSchema, defineTable } from "convex/server";

import { fileSchema, profileSchema, todoSchema } from "./schemas";

export default defineSchema({
	profiles: defineTable(zodToConvexFields(profileSchema.shape)).index("by_authUserId", [
		"authUserId",
	]),
	todos: defineTable(zodToConvexFields(todoSchema.shape)),
	files: defineTable(zodToConvexFields(fileSchema.shape)),
});
