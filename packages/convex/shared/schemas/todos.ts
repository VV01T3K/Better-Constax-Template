import { withSystemFields, zid } from "better-convex/server";
import { z } from "zod";

import { todoIdSchema } from "./ids";

// Zod-first app models; Convex validators are derived from these in `schema.ts`.
export const todoShape = {
	text: z.string().trim().min(1, "Todo text is required"),
	completed: z.boolean(),
	userId: zid("user"),
};

export const todoDocSchema = z.object(withSystemFields("todos", todoShape));

export const todoSchema = {
	list: {
		output: z.array(todoDocSchema.omit({ userId: true })),
	},
	add: {
		input: z.object({
			text: todoShape.text,
		}),
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
