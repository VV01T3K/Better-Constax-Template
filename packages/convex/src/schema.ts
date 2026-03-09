import { zodOutputToConvexFields } from "better-convex/server";
import { defineSchema, defineTable } from "convex/server";

// Auth tables are CLI-generated in `./generated/authSchema.ts`; app tables stay here.
import { fileShape } from "../shared/schemas/files";
import { todoShape } from "../shared/schemas/todos";
import { tables as authSchema } from "./generated/authSchema";

export default defineSchema({
	...authSchema,
	files: defineTable(zodOutputToConvexFields(fileShape)).index("by_user", ["userId"]),
	todos: defineTable(zodOutputToConvexFields(todoShape)).index("by_user", ["userId"]),
});
