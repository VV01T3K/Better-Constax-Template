import { todoSchema } from "@repo/convex/schemas/todos";
import {
	useMutation,
	useMutationState,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { z } from "zod";

import { useCRPC } from "@/integrations/convex/crpc";

const optimisticTodoSchema = todoSchema.list.output.element
	.omit({
		_id: true,
	})
	.extend({
		id: z.string(),
		status: z.enum(["pending", "confirmed", "failed"]),
		failedSubmissionId: z.number().optional(),
	});

type OptimisticTodo = z.infer<typeof optimisticTodoSchema>;
type AddTodoInput = z.infer<typeof todoSchema.add.input>;

type UseTodosOptimisticOptions = {
	simulateAddError?: boolean;
};

export function useTodosOptimistic(options: UseTodosOptimisticOptions = {}) {
	const { simulateAddError = false } = options;
	const c = useCRPC();
	const queryClient = useQueryClient();
	const { data: serverTodos } = useSuspenseQuery(c.func.todos.list.queryOptions({}));

	const pendingAddTodos = useMutationState({
		filters: { mutationKey: ["addTodo"], status: "pending" },
		select: (mutation) => {
			const parsedInput = todoSchema.add.input.safeParse(mutation.state.variables);
			if (!parsedInput.success) return null;

			return {
				submittedAt: mutation.state.submittedAt,
				text: parsedInput.data.text,
			};
		},
	});

	const pendingToggleTodos = useMutationState({
		filters: { mutationKey: ["toggleTodo"], status: "pending" },
		select: (mutation) => {
			const parsedInput = todoSchema.toggle.input.safeParse(mutation.state.variables);
			return parsedInput.success ? String(parsedInput.data._id) : null;
		},
	});

	const pendingRemoveTodos = useMutationState({
		filters: { mutationKey: ["removeTodo"], status: "pending" },
		select: (mutation) => {
			const parsedInput = todoSchema.remove.input.safeParse(mutation.state.variables);
			return parsedInput.success ? String(parsedInput.data._id) : null;
		},
	});

	const failedAddTodos = useMutationState({
		filters: { mutationKey: ["addTodo"], status: "error" },
		select: (mutation) => {
			const parsedInput = todoSchema.add.input.safeParse(mutation.state.variables);
			if (!parsedInput.success) return null;

			return {
				submittedAt: mutation.state.submittedAt,
				text: parsedInput.data.text,
			};
		},
	});

	const pendingToggleIds = new Set(pendingToggleTodos.filter((id): id is string => id !== null));
	const pendingRemoveIds = new Set(pendingRemoveTodos.filter((id): id is string => id !== null));

	const confirmedTodos: OptimisticTodo[] = serverTodos.map((todo) => ({
		id: todo._id,
		text: todo.text,
		completed: todo.completed,
		status: "confirmed",
		_creationTime: todo._creationTime,
	}));

	const pendingAddItems: OptimisticTodo[] = pendingAddTodos.flatMap((pendingTodo) => {
		if (!pendingTodo) return [];

		return [
			{
				id: `temp-${String(pendingTodo.submittedAt)}`,
				text: pendingTodo.text,
				completed: false,
				status: "pending",
				_creationTime: pendingTodo.submittedAt,
			},
		];
	});

	const failedAddItems: OptimisticTodo[] = failedAddTodos.flatMap((failedTodo) => {
		if (!failedTodo) return [];

		return [
			{
				id: `failed-${String(failedTodo.submittedAt)}`,
				text: failedTodo.text,
				completed: false,
				status: "failed",
				failedSubmissionId: failedTodo.submittedAt,
				_creationTime: failedTodo.submittedAt,
			},
		];
	});

	const todosWithOptimisticToggles = confirmedTodos.map((todo) => {
		if (pendingToggleIds.has(todo.id)) {
			return { ...todo, completed: !todo.completed, status: "pending" as const };
		}

		if (pendingRemoveIds.has(todo.id)) {
			return { ...todo, status: "pending" as const };
		}

		return todo;
	});

	const visibleTodos = todosWithOptimisticToggles.filter((todo) => !pendingRemoveIds.has(todo.id));

	const todos: OptimisticTodo[] = [...pendingAddItems, ...failedAddItems, ...visibleTodos].toSorted(
		(a, b) => b._creationTime - a._creationTime,
	);

	const addTodoMutation = useMutation({
		...c.func.todos.add.mutationOptions(),
		mutationKey: ["addTodo"],
	});

	const addTodoSimulatedErrorMutation = useMutation({
		mutationKey: ["addTodo"],
		mutationFn: async (_input: AddTodoInput) => {
			await new Promise((resolve) => setTimeout(resolve, 350));
			throw new Error("Simulated addTodo error");
		},
	});

	const toggleTodoMutation = useMutation({
		...c.func.todos.toggle.mutationOptions(),
		mutationKey: ["toggleTodo"],
	});

	const removeTodoMutation = useMutation({
		...c.func.todos.remove.mutationOptions(),
		mutationKey: ["removeTodo"],
	});

	const mutateAddTodo = (input: AddTodoInput) => {
		if (simulateAddError) {
			addTodoSimulatedErrorMutation.mutate(input);
			return;
		}

		addTodoMutation.mutate(input);
	};

	const dismissFailedAddTodoBySubmissionId = (submittedAt: number) => {
		const mutationCache = queryClient.getMutationCache();
		const addTodoMutations = mutationCache.findAll({ mutationKey: ["addTodo"] });

		for (const mutation of addTodoMutations) {
			if (mutation.state.status !== "error") continue;
			if (mutation.state.submittedAt !== submittedAt) continue;
			mutationCache.remove(mutation);
		}
	};

	const addTodo = (input: { text: string }) => {
		const parsedInput = todoSchema.add.input.safeParse(input);
		if (!parsedInput.success) return;
		mutateAddTodo(parsedInput.data);
	};

	const retryTodo = (input: { text: string; failedSubmissionId?: number }) => {
		const parsedInput = todoSchema.add.input.safeParse({ text: input.text });
		if (!parsedInput.success) return;

		const failedSubmissionId = input.failedSubmissionId;
		if (typeof failedSubmissionId === "number") {
			dismissFailedAddTodoBySubmissionId(failedSubmissionId);
		}

		mutateAddTodo(parsedInput.data);
	};

	const toggleTodo = (input: { id: string }) => {
		const parsedInput = todoSchema.toggle.input.safeParse(input);
		if (!parsedInput.success) return;
		toggleTodoMutation.mutate(parsedInput.data);
	};

	const removeTodo = (input: { id: string }) => {
		const parsedInput = todoSchema.remove.input.safeParse(input);
		if (!parsedInput.success) return;
		removeTodoMutation.mutate(parsedInput.data);
	};

	return {
		todos,
		addTodo,
		retryTodo,
		toggleTodo,
		removeTodo,
	};
}
