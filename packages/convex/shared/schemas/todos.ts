import { zid } from "better-convex/server";
import { z } from "zod";

import { zodTable } from "../../lib/zodHelpers";

export const todo = zodTable("todos", {
	userId: zid("user"),
	text: z
		.string()
		.trim()
		.min(1, "Todo text is required")
		.max(500, "Todo text must be 500 characters or less"),
	completed: z.boolean(),
});

export const todoSchema = {
	list: {
		output: z.array(todo.omit({ userId: true })),
	},
	add: {
		input: todo.pick({ text: true }),
	},
	toggle: {
		input: todo.pick({ _id: true }),
	},
	remove: {
		input: todo.pick({ _id: true }),
	},
} as const;
