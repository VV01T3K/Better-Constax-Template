import { todoSchema } from "@convex/schemas";
import { createCollection, localOnlyCollectionOptions } from "@tanstack/react-db";
import { z } from "zod";

const OptimisticTodoSchema = todoSchema.extend({
	id: z.string(),
	status: z.enum(["optimistic", "confirmed", "error"]),
	createdAt: z.number(),
});

export type OptimisticTodo = z.infer<typeof OptimisticTodoSchema>;

export const todosCollection = createCollection(
	localOnlyCollectionOptions({
		getKey: (todo) => todo.id,
		schema: OptimisticTodoSchema,
	}),
);
