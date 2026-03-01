import { todoSchema } from "@convex/schemas/todos";
import { describe, expect, it, vi } from "vitest";

import { normalizeFormError } from "@/features/forms";

import {
	canSubmitTodo,
	clearAcknowledgedOptimisticTodos,
	createOptimisticTodo,
	invokeTodoAction,
	markOptimisticTodoConfirmed,
	mergeVisibleTodos,
	removeOptimisticTodo,
} from "./optimistic";

describe("todo form and optimistic flow", () => {
	it("rejects empty and whitespace todo text via shared schema", () => {
		expect(todoSchema.add.input.safeParse({ text: "" }).success).toBe(false);
		expect(todoSchema.add.input.safeParse({ text: "   " }).success).toBe(false);
	});

	it("creates optimistic todo immediately and removes it after server catch-up", () => {
		const optimisticTodo = createOptimisticTodo("Ship release", "optimistic-1");
		const optimisticTodos = [optimisticTodo];

		expect(mergeVisibleTodos(optimisticTodos, []).length).toBe(1);

		const confirmed = markOptimisticTodoConfirmed(optimisticTodos, "optimistic-1", "todo-1");
		expect(confirmed[0]?.status).toBe("confirmed");

		const merged = mergeVisibleTodos(confirmed, [
			{ _id: "todo-1", completed: false, text: "Ship release" },
		]);
		expect(merged.length).toBe(1);
		expect(merged[0]?._id).toBe("optimistic-1");

		const reconciled = clearAcknowledgedOptimisticTodos(confirmed, [
			{ _id: "todo-1", completed: false, text: "Ship release" },
		]);
		expect(reconciled.length).toBe(0);
	});

	it("rolls back optimistic todo and exposes a submit-level error", () => {
		const optimisticTodo = createOptimisticTodo("Broken add", "optimistic-rollback");
		const optimisticTodos = [optimisticTodo];
		const rolledBack = removeOptimisticTodo(optimisticTodos, "optimistic-rollback");

		expect(rolledBack.length).toBe(0);

		const normalized = normalizeFormError(new Error("Create failed"));
		expect(normalized.formMessage).toBe("Create failed");
	});

	it("applies submit button disabled logic for invalid and pending states", () => {
		expect(canSubmitTodo({ canSubmit: true, isSubmitting: false, text: "ready" })).toBe(true);
		expect(canSubmitTodo({ canSubmit: false, isSubmitting: false, text: "ready" })).toBe(false);
		expect(canSubmitTodo({ canSubmit: true, isSubmitting: true, text: "ready" })).toBe(false);
		expect(canSubmitTodo({ canSubmit: true, isSubmitting: false, text: "   " })).toBe(false);
	});

	it("keeps toggle/remove action behavior for server todos only", () => {
		const action = vi.fn();

		const didInvokeServerTodo = invokeTodoAction({
			action,
			todo: { _id: "todo-1", completed: false, text: "Existing" },
		});
		expect(didInvokeServerTodo).toBe(true);
		expect(action).toHaveBeenCalledWith("todo-1");

		action.mockClear();
		const didInvokeOptimisticTodo = invokeTodoAction({
			action,
			todo: {
				_id: "optimistic-1",
				clientId: "optimistic-1",
				completed: false,
				isOptimistic: true,
				status: "pending",
				text: "Pending",
			},
		});
		expect(didInvokeOptimisticTodo).toBe(false);
		expect(action).not.toHaveBeenCalled();
	});
});
