import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { todoSchema } from "@convex/schemas";
import { useMutation, useMutationState, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";

const OptimisticTodoSchema = todoSchema.extend({
	id: z.string(),
	status: z.enum(["pending", "confirmed"]),
	createdAt: z.number(),
});

type OptimisticTodo = z.infer<typeof OptimisticTodoSchema>;

export function useTodosOptimisticTQ() {
	const { data: serverTodos } = useSuspenseQuery(convexQuery(api.functions.todos.list, {}));

	const pendingAddTodos = useMutationState({
		filters: { mutationKey: ["addTodo"], status: "pending" },
		select: (mutation) => ({
			submittedAt: mutation.state.submittedAt,
			// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
			text: (mutation.state.variables as { text: string }).text,
		}),
	});

	const pendingToggleTodos = useMutationState({
		filters: { mutationKey: ["toggleTodo"], status: "pending" },
		select: (mutation) => ({
			// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
			id: (mutation.state.variables as { id: Id<"todos"> }).id,
		}),
	});

	const pendingRemoveTodos = useMutationState({
		filters: { mutationKey: ["removeTodo"], status: "pending" },
		select: (mutation) => ({
			// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
			id: (mutation.state.variables as { id: Id<"todos"> }).id,
		}),
	});

	const confirmedTodos: OptimisticTodo[] = serverTodos.map((todo: Doc<"todos">) => ({
		id: todo._id,
		text: todo.text,
		completed: todo.completed,
		status: "confirmed" as const,
		createdAt: todo._creationTime,
	}));

	const pendingAddItems: OptimisticTodo[] = pendingAddTodos.map((variables) => ({
		id: `temp-${String(variables.submittedAt)}`,
		text: variables.text,
		completed: false,
		status: "pending" as const,
		createdAt: variables.submittedAt,
	}));

	const isTogglePending = (id: string) => pendingToggleTodos.some((t) => t.id === id);

	const isRemovePending = (id: string) => pendingRemoveTodos.some((t) => t.id === id);

	const todosWithOptimisticToggles = confirmedTodos.map((todo) => {
		if (isTogglePending(todo.id)) {
			return { ...todo, completed: !todo.completed, status: "pending" as const };
		}
		if (isRemovePending(todo.id)) {
			return { ...todo, status: "pending" as const };
		}
		return todo;
	});

	const visibleTodos = todosWithOptimisticToggles.filter((todo) => !isRemovePending(todo.id));

	const todos: OptimisticTodo[] = [...pendingAddItems, ...visibleTodos].toSorted(
		(a, b) => b.createdAt - a.createdAt,
	);

	const { mutate: addTodo } = useMutation({
		mutationKey: ["addTodo"],
		mutationFn: useConvexMutation(api.functions.todos.add),
	});

	const { mutate: toggleTodo } = useMutation({
		mutationKey: ["toggleTodo"],
		mutationFn: useConvexMutation(api.functions.todos.toggle),
	});

	const { mutate: removeTodo } = useMutation({
		mutationKey: ["removeTodo"],
		mutationFn: useConvexMutation(api.functions.todos.remove),
	});

	const totalPendingCount =
		pendingAddTodos.length + pendingToggleTodos.length + pendingRemoveTodos.length;

	return {
		todos,
		addTodo,
		toggleTodo,
		removeTodo,
		totalPendingCount,
	};
}
