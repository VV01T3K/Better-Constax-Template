import { Add01Icon, CircleIcon, Delete02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { todoSchema } from "@repo/convex/schemas/todos";
import { useForm } from "@tanstack/react-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

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

	const completedCount = todos.filter((todo) => todo.completed).length;
	const totalCount = todos.length;

	const form = useForm({
		defaultValues: {
			text: "",
		},
		validators: {
			onMount: todoSchema.add.input,
			onChange: todoSchema.add.input,
		},
		onSubmit: async ({ value, formApi }) => {
			await addTodo(todoSchema.add.input.parse(value));
			formApi.reset();
		},
	});

	return (
		<div
			className="flex min-h-screen items-center justify-center p-4"
			style={{
				background:
					"linear-gradient(135deg, #667a56 0%, #8fbc8f 25%, #90ee90 50%, #98fb98 75%, #f0fff0 100%)",
			}}
		>
			<div className="w-full max-w-2xl">
				{/* Header Card */}
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

				{/* Add Todo Card */}
				<div className="mb-6 rounded-2xl border border-green-200/50 bg-white/95 p-6 shadow-xl">
					<form
						className="flex gap-3"
						onSubmit={(e) => {
							e.preventDefault();
							void form.handleSubmit();
						}}
					>
						<form.Field name="text">
							{(field) => (
								<input
									type="text"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									placeholder="What needs to be done?"
									className="flex-1 rounded-xl border-2 border-green-200 bg-white/80 px-4 py-3 text-gray-800 placeholder-gray-500 transition-colors focus:border-green-400 focus:outline-none"
								/>
							)}
						</form.Field>
						<form.Subscribe
							selector={(state) =>
								[state.values.text, state.canSubmit, state.isSubmitting] as const
							}
						>
							{([text, canSubmit, isSubmitting]) => (
								<button
									type="submit"
									disabled={!text.trim() || !canSubmit || isSubmitting}
									className="flex items-center gap-2 rounded-xl bg-linear-to-r from-green-500 to-green-600 px-6 py-3 font-semibold text-white shadow-lg transition-colors duration-200 hover:from-green-600 hover:to-green-700 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400"
								>
									<HugeiconsIcon icon={Add01Icon} size={20} strokeWidth={2} />
									Add
								</button>
							)}
						</form.Subscribe>
					</form>
				</div>

				{/* Todos List */}
				<div className="overflow-hidden rounded-2xl border border-green-200/50 bg-white/95 shadow-xl">
					{todos.length === 0 ? (
						<div className="p-12 text-center">
							<HugeiconsIcon
								icon={CircleIcon}
								size={48}
								strokeWidth={2}
								className="mx-auto mb-4 text-green-300"
							/>
							<h3 className="mb-2 text-xl font-semibold text-green-800">No todos yet</h3>
							<p className="text-green-600">Add your first todo above to get started!</p>
						</div>
					) : (
						<div className="divide-y divide-green-100">
							{todos.map((todo) => (
								<div
									key={todo._id}
									className={`flex items-center gap-4 p-4 transition-colors hover:bg-green-50/50 ${
										todo.completed ? "opacity-75" : ""
									}`}
								>
									<button
										type="button"
										onClick={() => void toggleTodo({ id: todo._id })}
										aria-label={todo.completed ? "Mark as incomplete" : "Mark as complete"}
										className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
											todo.completed
												? "border-green-500 bg-green-500 text-white"
												: "border-green-300 text-transparent hover:border-green-400 hover:text-green-400"
										}`}
									>
										<HugeiconsIcon icon={Tick02Icon} size={14} strokeWidth={2} />
									</button>

									<span
										className={`flex-1 text-lg transition-colors duration-200 ${
											todo.completed ? "text-gray-500 line-through" : "text-gray-800"
										}`}
									>
										{todo.text}
									</span>

									<button
										type="button"
										onClick={() => void removeTodo({ id: todo._id })}
										className="shrink-0 rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
									>
										<HugeiconsIcon icon={Delete02Icon} size={18} strokeWidth={2} />
									</button>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Footer */}
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
