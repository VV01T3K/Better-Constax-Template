import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Circle, Plus, Trash2, Zap } from "lucide-react";
import { useCallback, useState } from "react";

import { api } from "../../../convex/_generated/api";
import { createTodoSchema } from "../../../convex/schemas";
import { StatusBadge } from "../../components/demo.status-badge";
import {
	useAddTodoOptimistic,
	useOptimisticTodos,
	useRemoveTodoOptimistic,
	useToggleTodoOptimistic,
} from "../../hooks/demo.useOptimisticTodos";

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

	const handleAddTodo = useCallback(() => {
		const result = createTodoSchema.safeParse({ text: newTodo.trim() });
		if (!result.success) {
			setValidationError(result.error.issues[0]?.message ?? "Invalid input");
			return;
		}
		setValidationError(null);
		addTodo(result.data.text);
		setNewTodo("");
	}, [addTodo, newTodo]);

	const completedCount = todos.filter((t) => t.completed).length;
	const pendingCount = todos.filter((t) => t.status === "optimistic").length;
	const totalCount = todos.length;

	return (
		<div
			className="min-h-screen flex items-center justify-center p-4"
			style={{
				background:
					"linear-gradient(135deg, #f59e0b 0%, #f97316 25%, #fb923c 50%, #fbbf24 75%, #fef3c7 100%)",
			}}
		>
			<div className="w-full max-w-2xl">
				{/* Header Card */}
				<div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-amber-200/50 p-8 mb-6">
					<div className="text-center">
						<h1 className="text-4xl font-bold text-amber-800 mb-2">
							TanStack DB - Optimistic Todos
						</h1>
						<p className="text-amber-600 text-lg">
							Instant UI updates with smart rollback
						</p>
						{totalCount > 0 && (
							<div className="mt-4 flex justify-center space-x-6 text-sm">
								<span className="text-amber-700 font-medium">
									{completedCount} completed
								</span>
								<span className="text-gray-600">
									{totalCount - completedCount} remaining
								</span>
								{pendingCount > 0 && (
									<span className="text-amber-500 font-medium animate-pulse">
										{pendingCount} syncing...
									</span>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Performance Callout */}
				<div className="bg-amber-50/90 backdrop-blur-sm rounded-xl border border-amber-300/60 p-4 mb-6 flex items-start gap-3">
					<Zap size={20} className="text-amber-600 shrink-0 mt-0.5" />
					<div className="text-sm">
						<p className="font-semibold text-amber-800">
							Optimistic updates enabled
						</p>
						<p className="text-amber-700">
							Changes appear instantly in the UI before server confirmation.
							Watch for the &quot;Pending...&quot; badge that transitions to
							confirmed state.
						</p>
					</div>
				</div>

				{/* Add Todo Card */}
				<div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-amber-200/50 p-6 mb-6">
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
							className="flex-1 px-4 py-3 rounded-xl border-2 border-amber-200 focus:border-amber-400 focus:outline-none text-gray-800 placeholder-gray-500 bg-white/80 transition-colors"
						/>
						<button
							type="button"
							onClick={handleAddTodo}
							disabled={!newTodo.trim()}
							className="bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
						>
							<Plus size={20} />
							Add
						</button>
					</div>
					{validationError && (
						<p className="mt-2 text-sm text-red-600">{validationError}</p>
					)}
				</div>

				{/* Todos List */}
				<div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-amber-200/50 overflow-hidden">
					{todos.length === 0 ? (
						<div className="p-12 text-center">
							<Circle size={48} className="text-amber-300 mx-auto mb-4" />
							<h3 className="text-xl font-semibold text-amber-800 mb-2">
								No todos yet
							</h3>
							<p className="text-amber-600">
								Add your first todo above to get started!
							</p>
						</div>
					) : (
						<div className="divide-y divide-amber-100">
							{todos.map((todo, index) => (
								<div
									key={todo.id}
									className={`p-4 flex items-center gap-4 hover:bg-amber-50/50 transition-all duration-200 ${
										todo.completed ? "opacity-75" : ""
									} ${todo.status === "optimistic" ? "opacity-60" : ""} ${
										todo.status === "error"
											? "bg-red-50/50 border-l-4 border-l-red-400"
											: ""
									}`}
									style={{
										animationDelay: `${index * 50}ms`,
									}}
								>
									<button
										type="button"
										onClick={() => toggleTodo(todo.id)}
										className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
											todo.completed
												? "bg-amber-500 border-amber-500 text-white"
												: "border-amber-300 hover:border-amber-400 text-transparent hover:text-amber-400"
										}`}
									>
										<Check size={14} />
									</button>

									<span
										className={`flex-1 text-lg transition-all duration-200 ${
											todo.completed
												? "line-through text-gray-500"
												: "text-gray-800"
										}`}
									>
										{todo.text}
									</span>

									<StatusBadge status={todo.status} />

									<button
										type="button"
										onClick={() => removeTodo(todo.id)}
										className="shrink-0 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
									>
										<Trash2 size={18} />
									</button>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="text-center mt-6">
					<p className="text-amber-800/80 text-sm">
						Built with TanStack DB + Convex &bull; Optimistic Updates with
						Rollback
					</p>
				</div>
			</div>
		</div>
	);
}
