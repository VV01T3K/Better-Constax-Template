import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { TodosExperience } from "@/features/todos/TodosExperience";
import type { TodoItem } from "@/features/todos/TodosExperience";

import { staticCRPC, useCRPC } from "../../../integrations/convex/crpc";

export const Route = createFileRoute("/_authenticated/demo/convex")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(staticCRPC.func.todos.list.staticQueryOptions({}));
	},
	component: ConvexTodos,
});

function ConvexTodos() {
	const c = useCRPC();
	const { data: todos, isFetching } = useSuspenseQuery(c.func.todos.list.queryOptions({}));
	const { mutateAsync: addTodo } = useMutation(c.func.todos.add.mutationOptions());
	const { mutateAsync: toggleTodo } = useMutation(c.func.todos.toggle.mutationOptions());
	const { mutateAsync: removeTodo } = useMutation(c.func.todos.remove.mutationOptions());
	type ToggleTodoInput = Parameters<typeof toggleTodo>[0];
	type RemoveTodoInput = Parameters<typeof removeTodo>[0];

	const normalizedTodos = useMemo<TodoItem[]>(
		() =>
			todos.map((todo) => ({
				_id: String(todo._id),
				completed: todo.completed,
				text: todo.text,
			})),
		[todos],
	);

	return (
		<TodosExperience
			isFetching={isFetching}
			onAdd={async (input) => String(await addTodo(input))}
			// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- string id from TodosExperience is always a valid Id<"todos">
			onRemove={async ({ id }) => removeTodo({ id: id as RemoveTodoInput["id"] })}
			// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- string id from TodosExperience is always a valid Id<"todos">
			onToggle={async ({ id }) => toggleTodo({ id: id as ToggleTodoInput["id"] })}
			todos={normalizedTodos}
		/>
	);
}
