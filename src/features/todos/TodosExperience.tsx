import { todoSchema } from "@convex/schemas/todos";
import { useForm } from "@tanstack/react-form";
import { Check, Circle, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { z } from "zod";

import {
	createSchemaForm,
	FieldControl,
	FieldMessage,
	normalizeFormError,
	SubmitState,
	type FormSubmitState,
} from "@/features/forms";

import {
	canSubmitTodo,
	clearAcknowledgedOptimisticTodos,
	createOptimisticTodo,
	invokeTodoAction,
	isOptimisticTodo,
	markOptimisticTodoConfirmed,
	mergeVisibleTodos,
	removeOptimisticTodo,
	type DisplayTodo,
	type OptimisticTodo,
} from "./optimistic";

export type TodoItem = {
	_id: string;
	completed: boolean;
	text: string;
};

export type TodosExperienceProps = {
	isFetching: boolean;
	onAdd: (input: z.input<typeof todoSchema.add.input>) => Promise<string>;
	onRemove: (input: { id: string }) => Promise<unknown>;
	onToggle: (input: { id: string }) => Promise<unknown>;
	todos: TodoItem[];
};

export function TodosExperience({
	isFetching,
	onAdd,
	onRemove,
	onToggle,
	todos,
}: TodosExperienceProps) {
	const [optimisticTodos, setOptimisticTodos] = useState<OptimisticTodo[]>([]);
	const [submitState, setSubmitState] = useState<FormSubmitState>({
		formMessage: null,
		isSubmitting: false,
	});

	const clearSubmitState = () => {
		setSubmitState((previous) => {
			if (!previous.formMessage && !previous.fieldErrors) {
				return previous;
			}

			return {
				...previous,
				fieldErrors: undefined,
				formMessage: null,
			};
		});
	};

	const form = useForm(
		createSchemaForm({
			defaultValues: {
				text: "",
			},
			onSubmit: async ({ formApi, value }) => {
				const optimisticTodo = createOptimisticTodo(value.text);
				const { clientId } = optimisticTodo;

				setSubmitState({
					fieldErrors: undefined,
					formMessage: null,
					isSubmitting: true,
				});
				setOptimisticTodos((previous) => [optimisticTodo, ...previous]);
				formApi.reset();

				try {
					const serverId = await onAdd(value);
					if (serverId.trim().length === 0) {
						setOptimisticTodos((previous) => removeOptimisticTodo(previous, clientId));
					} else {
						setOptimisticTodos((previous) =>
							markOptimisticTodoConfirmed(previous, clientId, serverId),
						);
					}

					setSubmitState({
						fieldErrors: undefined,
						formMessage: null,
						isSubmitting: false,
					});
				} catch (error) {
					const normalizedError = normalizeFormError(
						error,
						"Unable to add todo right now. Please try again.",
					);
					setOptimisticTodos((previous) => removeOptimisticTodo(previous, clientId));
					setSubmitState({
						fieldErrors: normalizedError.fieldErrors,
						formMessage: normalizedError.formMessage,
						isSubmitting: false,
					});
				}
			},
			schema: todoSchema.add.input,
		}),
	);

	useEffect(() => {
		if (optimisticTodos.length === 0) {
			return;
		}

		setOptimisticTodos((previous) => {
			const next = clearAcknowledgedOptimisticTodos(previous, todos);
			return next.length === previous.length ? previous : next;
		});
	}, [optimisticTodos.length, todos]);

	const visibleTodos = useMemo<DisplayTodo[]>(
		() => mergeVisibleTodos(optimisticTodos, todos),
		[optimisticTodos, todos],
	);

	const completedCount = visibleTodos.filter((todo) => todo.completed).length;
	const totalCount = visibleTodos.length;

	return (
		<div
			className="flex min-h-screen items-center justify-center p-4"
			style={{
				background:
					"linear-gradient(135deg, #667a56 0%, #8fbc8f 25%, #90ee90 50%, #98fb98 75%, #f0fff0 100%)",
			}}
		>
			<div className="w-full max-w-2xl">
				<div className="mb-6 rounded-2xl border border-green-200/50 bg-white/95 p-8 shadow-2xl">
					<div className="text-center">
						<h1 className="mb-2 text-4xl font-bold text-green-800">Convex Todos</h1>
						<p className="text-lg text-green-600">Powered by real-time sync</p>
						{totalCount > 0 && (
							<div className="mt-4 flex justify-center space-x-6 text-sm">
								<span className="font-medium text-green-700">{completedCount} completed</span>
								<span className="text-gray-600">{totalCount - completedCount} remaining</span>
							</div>
						)}
					</div>
				</div>

				<div className="mb-6 rounded-2xl border border-green-200/50 bg-white/95 p-6 shadow-xl">
					<form
						className="flex flex-col gap-3"
						onSubmit={(e) => {
							e.preventDefault();
							void form.handleSubmit();
						}}
					>
						<div className="flex gap-3">
							<form.Field name="text">
								{(field) => {
									const mergedErrors = [
										...field.state.meta.errors,
										...(submitState.fieldErrors?.text ?? []),
									];

									return (
										<div className="flex-1">
											<FieldControl field={field}>
												{(control) => (
													<input
														{...control}
														className="flex-1 rounded-xl border-2 border-green-200 bg-white/80 px-4 py-3 text-gray-800 placeholder-gray-500 transition-colors focus:border-green-400 focus:outline-none"
														data-testid="add-todo-input"
														onChange={(event) => {
															clearSubmitState();
															control.onChange(event);
														}}
														placeholder="What needs to be done?"
														type="text"
													/>
												)}
											</FieldControl>
											<FieldMessage
												className="mt-2 text-sm font-medium text-red-600"
												errors={mergedErrors}
											/>
										</div>
									);
								}}
							</form.Field>
							<form.Subscribe
								selector={(state) =>
									[state.values.text, state.canSubmit, state.isSubmitting] as const
								}
							>
								{([text, canSubmit, isSubmitting]) => (
									<button
										className="flex items-center gap-2 rounded-xl bg-linear-to-r from-green-500 to-green-600 px-6 py-3 font-semibold text-white shadow-lg transition-colors duration-200 hover:from-green-600 hover:to-green-700 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400"
										data-testid="add-todo-submit"
										disabled={!canSubmitTodo({ canSubmit, isSubmitting, text })}
										type="submit"
									>
										<Plus size={20} />
										{isSubmitting ? "Adding..." : "Add"}
									</button>
								)}
							</form.Subscribe>
						</div>
						<SubmitState
							className="mt-1"
							errorClassName="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
							errorMessage={submitState.formMessage}
							isSubmitting={submitState.isSubmitting}
							pendingClassName="text-sm font-medium text-green-700"
							pendingText="Saving todo..."
						/>
					</form>
				</div>

				<div className="overflow-hidden rounded-2xl border border-green-200/50 bg-white/95 shadow-xl">
					{visibleTodos.length === 0 ? (
						<div className="p-12 text-center">
							<Circle className="mx-auto mb-4 text-green-300" size={48} />
							<h3 className="mb-2 text-xl font-semibold text-green-800">No todos yet</h3>
							<p className="text-green-600">Add your first todo above to get started!</p>
						</div>
					) : (
						<div className="divide-y divide-green-100">
							{visibleTodos.map((todo, index) => {
								const optimistic = isOptimisticTodo(todo);

								return (
									<div
										className={`flex items-center gap-4 p-4 transition-colors hover:bg-green-50/50 ${
											todo.completed ? "opacity-75" : ""
										}`}
										data-testid={optimistic ? "todo-item-optimistic" : "todo-item-real"}
										key={todo._id}
										style={{
											animationDelay: `${index * 50}ms`,
										}}
									>
										<button
											className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
												todo.completed
													? "border-green-500 bg-green-500 text-white"
													: "border-green-300 text-transparent hover:border-green-400 hover:text-green-400"
											}`}
											data-testid={`toggle-todo-${todo._id}`}
											disabled={optimistic}
											onClick={() => {
												invokeTodoAction({
													action: (id) => {
														void onToggle({ id });
													},
													todo,
												});
											}}
											type="button"
										>
											<Check size={14} />
										</button>

										<div className="flex-1">
											<span
												className={`block text-lg transition-colors duration-200 ${
													todo.completed ? "text-gray-500 line-through" : "text-gray-800"
												}`}
											>
												{todo.text}
											</span>
											{optimistic && (
												<span
													className="text-xs font-medium text-green-700/80"
													data-testid="todo-sync-status"
												>
													{todo.status === "pending" ? "Sending..." : "Syncing..."}
												</span>
											)}
										</div>

										<button
											className="shrink-0 rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
											data-testid={`remove-todo-${todo._id}`}
											disabled={optimistic}
											onClick={() => {
												invokeTodoAction({
													action: (id) => {
														void onRemove({ id });
													},
													todo,
												});
											}}
											type="button"
										>
											<Trash2 size={18} />
										</button>
									</div>
								);
							})}
						</div>
					)}
				</div>

				<div className="mt-6 text-center">
					<p className="text-sm text-green-700/80">
						Built with Better Convex • Real-time updates • Always in sync
					</p>
				</div>

				{isFetching && (
					<p className="mt-3 text-center text-xs font-medium text-green-700/80">Syncing...</p>
				)}
			</div>
		</div>
	);
}
