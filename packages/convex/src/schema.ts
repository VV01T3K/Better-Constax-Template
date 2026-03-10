import { defineSchema, defineTable } from "convex/server";

import { zodToConvex } from "../lib/zodHelpers";
import { file } from "../shared/schemas/files";
import { todo } from "../shared/schemas/todos";
// Auth tables are CLI-generated in `./generated/authSchema.ts`; app tables stay here.
import { tables as authSchema } from "./generated/authSchema";

export default defineSchema({
	...authSchema,
	files: defineTable(zodToConvex(file)).index("by_user", ["userId"]),
	todos: defineTable(zodToConvex(todo)).index("by_user", ["userId"]),
});
