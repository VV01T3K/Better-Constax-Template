import { zodOutputToConvexFields } from "convex-helpers/server/zod4";
import { defineSchema, defineTable } from "convex/server";

// Auth tables are CLI-generated in `./generated/authSchema.ts`; app tables stay here.
import { todoShape } from "../shared/schemas/todos";
import { tables as authSchema } from "./generated/authSchema";

export default defineSchema({
	...authSchema,
	todos: defineTable(zodOutputToConvexFields(todoShape)).index("by_user", ["userId"]),
});
