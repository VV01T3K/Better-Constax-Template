import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { createTodoSchema } from "@convex/schemas";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Circle, Plus, Trash2, Zap } from "lucide-react";
import { useState } from "react";

import { StatusBadge } from "@/components/demo.status-badge";
import {
	useAddTodoOptimistic,
	useOptimisticTodos,
	useRemoveTodoOptimistic,
	useToggleTodoOptimistic,
} from "@/hooks/demo.useOptimisticTodos";

export const Route = createFileRoute("/demo/db-optimistic")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(convexQuery(api.todos.list, {}));
	},
	component: DbOptimisticTodos,
});

function DbOptimisticTodos() {
	const todos = useOptimisticTodos();

	const { addTodo } = useAddTodoOptimistic();
	const { toggleTodo } = useToggleTodoOptimistic();
	const { removeTodo } = useRemoveTodoOptimistic();

	const [newTodo, setNewTodo] = useState("");
	const [validationError, setValidationError] = useState<string | null>(null);

	const handleAddTodo = () => {
		const result = createTodoSchema.safeParse({ text: newTodo.trim() });
		if (!result.success) {
			setValidationError(result.error.issues[0]?.message ?? "Invalid input");
			return;
		}
		setValidationError(null);
		addTodo(result.data.text);
		setNewTodo("");
	};

	const completedCount = todos.filter((t) => t.completed).length;
	const pendingCount = todos.filter((t) => t.status === "optimistic").length;
	const totalCount = todos.length;

	return (
		<div
			className="flex min-h-screen items-center justify-center p-4"
			style={{
				background:
					"linear-gradient(135deg, #f59e0b 0%, #f97316 25%, #fb923c 50%, #fbbf24 75%, #fef3c7 100%)",
			}}
		>
			<div className="w-full max-w-2xl">
				{/* Header Card */}
				<div className="mb-6 rounded-2xl border border-amber-200/50 bg-white p-8 shadow-2xl">
					<div className="text-center">
						<h1 className="mb-2 text-4xl font-bold text-amber-800">
							TanStack DB - Optimistic Todos
						</h1>
						<p className="text-lg text-amber-600">Instant UI updates with smart rollback</p>
						{totalCount > 0 && (
							<div className="mt-4 flex justify-center space-x-6 text-sm">
								<span className="font-medium text-amber-700">{completedCount} completed</span>
								<span className="text-gray-600">{totalCount - completedCount} remaining</span>
								{pendingCount > 0 && (
									<span className="animate-pulse font-medium text-amber-500">
										{pendingCount} syncing...
									</span>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Performance Callout */}
				<div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-4">
					<Zap size={20} className="mt-0.5 shrink-0 text-amber-600" />
					<div className="text-sm">
						<p className="font-semibold text-amber-800">Optimistic updates enabled</p>
						<p className="text-amber-700">
							Changes appear instantly in the UI before server confirmation. Watch for the
							&quot;Pending...&quot; badge that transitions to confirmed state.
						</p>
					</div>
				</div>

				{/* Add Todo Card */}
				<div className="mb-6 rounded-2xl border border-amber-200/50 bg-white p-6 shadow-xl">
					<div className="flex gap-3">
						<input
							type="text"
							value={newTodo}
							onChange={(e) => setNewTodo(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleAddTodo();
								}
							}}
							placeholder="What needs to be done?"
							className="flex-1 rounded-xl border-2 border-amber-200 bg-white/80 px-4 py-3 text-gray-800 placeholder-gray-500 transition-colors focus:border-amber-400 focus:outline-none"
						/>
						<button
							type="button"
							onClick={handleAddTodo}
							disabled={!newTodo.trim()}
							className="flex items-center gap-2 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-amber-600 hover:to-orange-600 hover:shadow-xl disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400"
						>
							<Plus size={20} />
							Add
						</button>
					</div>
					{validationError && <p className="mt-2 text-sm text-red-600">{validationError}</p>}
				</div>

				{/* Todos List */}
				<div className="overflow-hidden rounded-2xl border border-amber-200/50 bg-white shadow-xl">
					{todos.length === 0 ? (
						<div className="p-12 text-center">
							<Circle size={48} className="mx-auto mb-4 text-amber-300" />
							<h3 className="mb-2 text-xl font-semibold text-amber-800">No todos yet</h3>
							<p className="text-amber-600">Add your first todo above to get started!</p>
						</div>
					) : (
						<div className="divide-y divide-amber-100">
							{todos.map((todo, index) => (
								<div
									key={todo.id}
									className={`flex items-center gap-4 p-4 transition-all duration-200 hover:bg-amber-50/50 ${
										todo.completed ? "opacity-75" : ""
									} ${todo.status === "optimistic" ? "opacity-60" : ""} ${
										todo.status === "error" ? "border-l-4 border-l-red-400 bg-red-50/50" : ""
									}`}
									style={{
										animationDelay: `${index * 50}ms`,
									}}
								>
									<button
										type="button"
										onClick={() => toggleTodo(todo.id)}
										className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
											todo.completed
												? "border-amber-500 bg-amber-500 text-white"
												: "border-amber-300 text-transparent hover:border-amber-400 hover:text-amber-400"
										}`}
									>
										<Check size={14} />
									</button>

									<span
										className={`flex-1 text-lg transition-all duration-200 ${
											todo.completed ? "text-gray-500 line-through" : "text-gray-800"
										}`}
									>
										{todo.text}
									</span>

									<StatusBadge status={todo.status} />

									<button
										type="button"
										onClick={() => removeTodo(todo.id)}
										className="shrink-0 rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
									>
										<Trash2 size={18} />
									</button>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="mt-6 text-center">
					<p className="text-sm text-amber-800/80">
						Built with TanStack DB + Convex &bull; Optimistic Updates with Rollback
					</p>
				</div>
			</div>
		</div>
	);
}
