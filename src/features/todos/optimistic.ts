import type { TodoItem } from "./TodosExperience";

export type OptimisticTodo = TodoItem & {
	clientId: string;
	isOptimistic: true;
	serverId?: string;
	status: "confirmed" | "pending";
};

export type DisplayTodo = OptimisticTodo | TodoItem;

export const isOptimisticTodo = (todo: DisplayTodo): todo is OptimisticTodo =>
	"isOptimistic" in todo;

export const createOptimisticId = () => {
	const randomUuid = globalThis.crypto?.randomUUID?.();
	if (randomUuid) {
		return `optimistic-${randomUuid}`;
	}

	return `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const createOptimisticTodo = (
	text: string,
	clientId = createOptimisticId(),
): OptimisticTodo => ({
	_id: clientId,
	clientId,
	completed: false,
	isOptimistic: true,
	status: "pending",
	text,
});

export const markOptimisticTodoConfirmed = (
	optimisticTodos: OptimisticTodo[],
	clientId: string,
	serverId: string,
): OptimisticTodo[] =>
	optimisticTodos.map((todo) =>
		todo.clientId === clientId ? { ...todo, serverId, status: "confirmed" } : todo,
	);

export const removeOptimisticTodo = (
	optimisticTodos: OptimisticTodo[],
	clientId: string,
): OptimisticTodo[] => optimisticTodos.filter((todo) => todo.clientId !== clientId);

export const clearAcknowledgedOptimisticTodos = (
	optimisticTodos: OptimisticTodo[],
	serverTodos: TodoItem[],
): OptimisticTodo[] => {
	const serverTodoIds = new Set(serverTodos.map((todo) => todo._id));
	return optimisticTodos.filter((todo) => !todo.serverId || !serverTodoIds.has(todo.serverId));
};

export const mergeVisibleTodos = (
	optimisticTodos: OptimisticTodo[],
	serverTodos: TodoItem[],
): DisplayTodo[] => {
	if (optimisticTodos.length === 0) {
		return serverTodos;
	}

	const confirmedServerIds = new Set(
		optimisticTodos
			.map((todo) => todo.serverId)
			.filter((serverId): serverId is string => Boolean(serverId)),
	);

	return [...optimisticTodos, ...serverTodos.filter((todo) => !confirmedServerIds.has(todo._id))];
};

export const canSubmitTodo = ({
	canSubmit,
	isSubmitting,
	text,
}: {
	canSubmit: boolean;
	isSubmitting: boolean;
	text: string;
}) => text.trim().length > 0 && canSubmit && !isSubmitting;

export const invokeTodoAction = ({
	action,
	todo,
}: {
	action: (id: string) => void;
	todo: DisplayTodo;
}) => {
	if (isOptimisticTodo(todo)) {
		return false;
	}

	action(todo._id);
	return true;
};
