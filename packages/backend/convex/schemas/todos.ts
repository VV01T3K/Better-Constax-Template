import { z } from "zod";

import { authUserIdSchema } from "./ids";

export const todoSchema = z.object({
	authUserId: authUserIdSchema,
	text: z.string().min(1, "Text is required"),
	completed: z.boolean(),
});

export const createTodoSchema = todoSchema.pick({ text: true });
export const updateTodoSchema = todoSchema.partial();
