import { zodToConvexFields } from "convex-helpers/server/zod4";
import { defineSchema, defineTable } from "convex/server";

import { addressFormSubmissionSchema, fileSchema, todoSchema } from "./schemas";

export default defineSchema({
	todos: defineTable(zodToConvexFields(todoSchema.shape)),
	files: defineTable(zodToConvexFields(fileSchema.shape)),
	addressSubmissions: defineTable(zodToConvexFields(addressFormSubmissionSchema.shape)),
});
