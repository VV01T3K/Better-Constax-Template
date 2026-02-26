import { withSystemFields, zid } from "better-convex/server";
import { z } from "zod";

// Zod-first app models; Convex validators are derived from these in `schema.ts`.
export const productShape = {
	title: z.string(),
	imageId: z.string(),
	price: z.number(),
};

export const todoShape = {
	text: z.string(),
	completed: z.boolean(),
	userId: z.string(),
};

export const todoDocSchema = z.object(withSystemFields("todos", todoShape));

export const listTodosInputSchema = z.object({});
export const listTodosOutputSchema = z.array(todoDocSchema);

export const addTodoInputSchema = z.object({
	text: todoShape.text,
});
export const addTodoOutputSchema = zid("todos");

export const todoIdInputSchema = z.object({
	id: zid("todos"),
});
export const emptyMutationOutputSchema = z.null();
