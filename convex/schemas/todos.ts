import { z } from "zod";

export const todoSchema = z.object({
	authUserId: z.string(),
	text: z.string().min(1, "Text is required"),
	completed: z.boolean(),
});

export const createTodoSchema = todoSchema.pick({ text: true });
export const updateTodoSchema = todoSchema.partial();
