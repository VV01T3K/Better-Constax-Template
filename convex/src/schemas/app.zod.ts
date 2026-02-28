import { withSystemFields, zid } from "better-convex/server";
import { z } from "zod";

import type { Id } from "../_generated/dataModel";

// Zod-first app models; Convex validators are derived from these in `schema.ts`.
export const todoShape = {
	text: z.string().trim().min(1, "Todo text is required"),
	completed: z.boolean(),
	userId: z.string(),
};
const todoIdSchema = z.custom<Id<"todos">>((val) => typeof val === "string", {
	message: "Expected a Todo table string ID",
});

export const todoDocSchema = z.object(withSystemFields("todos", todoShape));

export const todoSchema = {
	list: {
		output: z.array(todoDocSchema),
	},
	add: {
		input: z.object({
			text: todoShape.text,
		}),
		output: zid("todos"),
	},
	toggle: {
		input: z.object({
			id: todoIdSchema,
		}),
	},
	remove: {
		input: z.object({
			id: todoIdSchema,
		}),
	},
} as const;
