import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { type OptimisticTodo, todosCollection } from "@/db-collections";

function mapServerTodo(todo: Doc<"todos">): OptimisticTodo {
	return {
		id: todo._id,
		text: todo.text,
		completed: todo.completed,
		status: "confirmed",
		createdAt: todo._creationTime,
	};
}

function sortDesc(todos: OptimisticTodo[]) {
	return [...todos].toSorted((a, b) => b.createdAt - a.createdAt);
}

type ServerTodo = OptimisticTodo & { id: Id<"todos"> };

const isServerTodo = (todo: OptimisticTodo): todo is ServerTodo =>
	todo.status === "confirmed" || todo.status === "error";

function readCollectionTodos(): OptimisticTodo[] {
	return sortDesc(todosCollection.toArray);
}

function syncServerToCollection(serverTodos: Array<Doc<"todos">>) {
	const serverIds = new Set(serverTodos.map((t) => String(t._id)));

	// Remove items no longer on server (skip optimistic items)
	for (const key of Array.from(todosCollection.keys())) {
		const item = todosCollection.get(key);
		if (!serverIds.has(key) && item?.status !== "optimistic") {
			todosCollection.delete(key);
		}
	}

	// Upsert server state
	for (const todo of serverTodos) {
		if (todosCollection.has(todo._id)) {
			todosCollection.update(todo._id, (draft) => {
				draft.text = todo.text;
				draft.completed = todo.completed;
				draft.status = "confirmed";
			});
		} else {
			todosCollection.insert(mapServerTodo(todo));
		}
	}
}

export function useOptimisticTodos() {
	const { data: serverTodos } = useSuspenseQuery(convexQuery(api.functions.todos.list, {}));

	// SSR-safe initial state from server data
	const [todos, setTodos] = useState<OptimisticTodo[]>(() =>
		sortDesc(serverTodos.map(mapServerTodo)),
	);

	useEffect(() => {
		// Sync server data into collection
		syncServerToCollection(serverTodos);
		setTodos(readCollectionTodos());

		// Subscribe to collection changes for reactive updates
		const subscription = todosCollection.subscribeChanges(() => {
			setTodos(readCollectionTodos());
		});

		return () => subscription.unsubscribe();
	}, [serverTodos]);

	return todos;
}

export function useAddTodoOptimistic() {
	const addTodoMutation = useConvexMutation(api.functions.todos.add);
	const [error, setError] = useState<string | null>(null);

	const addTodo = async (text: string) => {
		const tempId = crypto.randomUUID();
		setError(null);

		todosCollection.insert({
			id: tempId,
			text,
			completed: false,
			status: "optimistic",
			createdAt: Date.now(),
		});

		try {
			const convexId = await addTodoMutation({ text });

			// Remove temp entry and insert with real ID
			todosCollection.delete(tempId);
			todosCollection.insert({
				id: convexId,
				text,
				completed: false,
				status: "confirmed",
				createdAt: Date.now(),
			});
		} catch {
			todosCollection.delete(tempId);
			setError("Failed to add todo");
		}
	};

	return { addTodo, error };
}

export function useToggleTodoOptimistic() {
	const toggleMutation = useConvexMutation(api.functions.todos.toggle);
	const [error, setError] = useState<string | null>(null);

	const toggleTodo = async (id: string) => {
		const current = todosCollection.get(id);
		if (!current || !isServerTodo(current)) return;

		const previousCompleted = current.completed;
		setError(null);

		todosCollection.update(id, (draft) => {
			draft.completed = !previousCompleted;
			draft.status = "optimistic";
		});

		try {
			await toggleMutation({ id: current.id });
			todosCollection.update(id, (draft) => {
				draft.status = "confirmed";
			});
		} catch {
			todosCollection.update(id, (draft) => {
				draft.completed = previousCompleted;
				draft.status = "error";
			});
			setError("Failed to toggle todo");

			setTimeout(() => {
				todosCollection.update(id, (draft) => {
					draft.status = "confirmed";
				});
			}, 2000);
		}
	};

	return { toggleTodo, error };
}

export function useRemoveTodoOptimistic() {
	const removeMutation = useConvexMutation(api.functions.todos.remove);
	const [error, setError] = useState<string | null>(null);

	const removeTodo = async (id: string) => {
		const removedTodo = todosCollection.get(id);
		if (!removedTodo || !isServerTodo(removedTodo)) return;

		setError(null);
		todosCollection.delete(id);

		try {
			await removeMutation({ id: removedTodo.id });
		} catch {
			// Rollback - restore the item with error state
			todosCollection.insert({
				...removedTodo,
				status: "error",
			});
			setError("Failed to remove todo");

			setTimeout(() => {
				todosCollection.update(id, (draft) => {
					draft.status = "confirmed";
				});
			}, 2000);
		}
	};

	return { removeTodo, error };
}
