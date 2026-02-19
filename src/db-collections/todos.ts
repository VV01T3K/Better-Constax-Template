import type { Id } from "@convex/_generated/dataModel";
import { createTodoSchema, todoSchema } from "@convex/schemas";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import type { QueryClient } from "@tanstack/react-query";
import { z } from "zod";

const localTodoSchema = todoSchema.extend({
	id: z.string(),
	createdAt: z.number(),
	optimistic: z.boolean().optional(),
});

export type LocalTodo = z.infer<typeof localTodoSchema>;

const serverTodoSchema = todoSchema.extend({
	_id: z.custom<Id<"todos">>(),
	_creationTime: z.number(),
});

type ServerTodo = z.infer<typeof serverTodoSchema>;

export type TodosClient = {
	list: () => Promise<ServerTodo[]>;
	add: (input: z.infer<typeof createTodoSchema>) => Promise<Id<"todos">>;
	setCompleted: (input: { id: Id<"todos">; completed: boolean }) => Promise<void>;
	remove: (input: { id: Id<"todos"> }) => Promise<void>;
};

type CreateTodosCollectionOptions = {
	queryClient: QueryClient;
	todosClient: TodosClient;
};

export const TODOS_DB_OPTIMISTIC_QUERY_KEY = ["todos-db-optimistic"] as const;

function createTempTodoId() {
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		return `tmp:${crypto.randomUUID()}`;
	}
	return `tmp:${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isServerTodoId(id: string): id is Id<"todos"> {
	return !id.startsWith("tmp:");
}

export function createOptimisticTodo(text: string): LocalTodo {
	const validated = createTodoSchema.parse({ text });
	return {
		id: createTempTodoId(),
		text: validated.text,
		completed: false,
		createdAt: Date.now(),
		optimistic: true,
	};
}

export function toLocalTodo(todo: ServerTodo): LocalTodo {
	return {
		id: String(todo._id),
		text: todo.text,
		completed: todo.completed,
		createdAt: todo._creationTime,
		optimistic: false,
	};
}

export function createTodosCollection({ queryClient, todosClient }: CreateTodosCollectionOptions) {
	return createCollection(
		queryCollectionOptions<LocalTodo>({
			id: "todos-db-optimistic",
			queryKey: TODOS_DB_OPTIMISTIC_QUERY_KEY,
			queryClient,
			startSync: true,
			getKey: (item) => item.id,
			queryFn: async () => {
				const todos = await todosClient.list();
				return todos.map(toLocalTodo);
			},
			onInsert: async ({ transaction, collection }) => {
				const createdIds = await Promise.all(
					transaction.mutations.map(async (mutation) => {
						return await todosClient.add({
							text: mutation.modified.text,
						});
					}),
				);

				collection.utils.writeBatch(() => {
					transaction.mutations.forEach((mutation, index) => {
						const tempId = String(mutation.key);
						const id = createdIds[index];
						collection.utils.writeDelete(tempId);
						collection.utils.writeInsert({
							id: String(id),
							text: mutation.modified.text,
							completed: mutation.modified.completed,
							createdAt: mutation.modified.createdAt,
							optimistic: false,
						});
					});
				});
			},
			onUpdate: async ({ transaction }) => {
				await Promise.all(
					transaction.mutations.map(async (mutation) => {
						const id = String(mutation.key);
						if (!isServerTodoId(id)) {
							return;
						}

						await todosClient.setCompleted({
							id,
							completed: mutation.modified.completed,
						});
					}),
				);
			},
			onDelete: async ({ transaction }) => {
				await Promise.all(
					transaction.mutations.map(async (mutation) => {
						const id = String(mutation.key);
						if (!isServerTodoId(id)) {
							return;
						}

						await todosClient.remove({
							id,
						});
					}),
				);
			},
		}),
	);
}
