import { zodOutputToConvexFields } from "convex-helpers/server/zod4";
import { defineSchema, defineTable } from "convex/server";

// Auth tables are CLI-generated in `./authSchema.ts`; app tables stay here.
import { productShape, todoShape } from "./app.zod";
import { tables as authSchema } from "./authSchema";

export default defineSchema({
	...authSchema,
	products: defineTable(zodOutputToConvexFields(productShape)),
	todos: defineTable(zodOutputToConvexFields(todoShape)).index("by_user", ["userId"]),
});
