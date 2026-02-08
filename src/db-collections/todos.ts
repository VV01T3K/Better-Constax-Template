import {
	createCollection,
	localOnlyCollectionOptions,
} from "@tanstack/react-db";
import { z } from "zod";

const OptimisticTodoSchema = z.object({
	id: z.string(),
	text: z.string(),
	completed: z.boolean(),
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
