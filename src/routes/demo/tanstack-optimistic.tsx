import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { createTodoSchema } from "@convex/schemas";
import { useMutationState } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Circle, Loader2, Plus, Trash2, Zap } from "lucide-react";
import { useState } from "react";

import { useTodosOptimisticTQ } from "@/hooks/useTodosOptimisticTQ";
import { requireRoutePermission } from "@/lib/route-guards";

export const Route = createFileRoute("/demo/tanstack-optimistic")({
	loader: async ({ context, location }) => {
		await requireRoutePermission({
			queryClient: context.queryClient,
			permission: "demo.todos.manage",
			redirectHref: location.href,
		});
		await context.queryClient.ensureQueryData(convexQuery(api.functions.todos.list, {}));
	},
	component: TanStackOptimisticTodos,
});

function GlobalPendingIndicator() {
	const pendingMutations = useMutationState({
		filters: {
			status: "pending",
			predicate: (mutation) => {
				const key = mutation.options.mutationKey;
				return (
					Array.isArray(key) &&
					(key[0] === "addTodo" || key[0] === "toggleTodo" || key[0] === "removeTodo")
				);
			},
		},
	});

	if (pendingMutations.length === 0) return null;

	return (
		<div className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
			<Loader2 size={16} className="animate-spin" />
			{pendingMutations.length} {pendingMutations.length === 1 ? "change" : "changes"} syncing...
		</div>
	);
}

function TanStackOptimisticTodos() {
	const { todos, addTodo, toggleTodo, removeTodo } = useTodosOptimisticTQ();

	const [newTodo, setNewTodo] = useState("");
	const [validationError, setValidationError] = useState<string | null>(null);

	const handleAddTodo = () => {
		const result = createTodoSchema.safeParse({ text: newTodo.trim() });
		if (!result.success) {
			setValidationError(result.error.issues[0]?.message ?? "Invalid input");
			return;
		}
		setValidationError(null);
		addTodo({ text: result.data.text });
		setNewTodo("");
	};

	const handleToggleTodo = (id: string) => {
		toggleTodo({ id });
	};

	const handleRemoveTodo = (id: string) => {
		removeTodo({ id });
	};

	const completedCount = todos.filter((t) => t.completed).length;
	const pendingCount = todos.filter((t) => t.status === "pending").length;
	const totalCount = todos.length;

	return (
		<div
			className="flex min-h-screen items-center justify-center p-4"
			style={{
				background:
					"linear-gradient(135deg, #4f46e5 0%, #7c3aed 25%, #a855f7 50%, #c084fc 75%, #e9d5ff 100%)",
			}}
		>
			<div className="w-full max-w-2xl">
				<div className="mb-6 rounded-2xl border border-purple-200/50 bg-white p-8 shadow-2xl">
					<div className="text-center">
						<h1 className="mb-2 text-4xl font-bold text-purple-800">
							TanStack Query - Optimistic Todos
						</h1>
						<p className="text-lg text-purple-600">useMutationState for visual optimism</p>
						{totalCount > 0 && (
							<div className="mt-4 flex justify-center space-x-6 text-sm">
								<span className="font-medium text-purple-700">{completedCount} completed</span>
								<span className="text-gray-600">{totalCount - completedCount} remaining</span>
								{pendingCount > 0 && (
									<span className="animate-pulse font-medium text-purple-500">
										{pendingCount} syncing...
									</span>
								)}
							</div>
						)}
					</div>
				</div>

				<div className="mb-6 flex items-start gap-3 rounded-xl border border-purple-300/60 bg-purple-50 p-4">
					<Zap size={20} className="mt-0.5 shrink-0 text-purple-600" />
					<div className="text-sm">
						<p className="font-semibold text-purple-800">Zero cache manipulation</p>
						<p className="text-purple-700">
							Uses useMutationState to track pending mutations. No onMutate/onError callbacks
							needed.
						</p>
					</div>
				</div>

				<div className="mb-6 rounded-2xl border border-purple-200/50 bg-white p-6 shadow-xl">
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
							className="flex-1 rounded-xl border-2 border-purple-200 bg-white/80 px-4 py-3 text-gray-800 placeholder-gray-500 transition-colors focus:border-purple-400 focus:outline-none"
						/>
						<button
							type="button"
							onClick={handleAddTodo}
							disabled={!newTodo.trim()}
							className="flex items-center gap-2 rounded-xl bg-linear-to-r from-purple-500 to-indigo-500 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-purple-600 hover:to-indigo-600 hover:shadow-xl disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400"
						>
							<Plus size={20} />
							Add
						</button>
					</div>
					{validationError && <p className="mt-2 text-sm text-red-600">{validationError}</p>}
				</div>

				<div className="overflow-hidden rounded-2xl border border-purple-200/50 bg-white shadow-xl">
					{todos.length === 0 ? (
						<div className="p-12 text-center">
							<Circle size={48} className="mx-auto mb-4 text-purple-300" />
							<h3 className="mb-2 text-xl font-semibold text-purple-800">No todos yet</h3>
							<p className="text-purple-600">Add your first todo above to get started!</p>
						</div>
					) : (
						<div className="divide-y divide-purple-100">
							{todos.map((todo, index) => (
								<div
									key={todo.id}
									className={`flex items-center gap-4 p-4 transition-all duration-200 hover:bg-purple-50/50 ${
										todo.completed ? "opacity-75" : ""
									} ${todo.status === "pending" ? "opacity-60" : ""}`}
									style={{
										animationDelay: `${index * 50}ms`,
									}}
								>
									<button
										type="button"
										onClick={() => handleToggleTodo(todo.id)}
										disabled={todo.status === "pending"}
										className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
											todo.completed
												? "border-purple-500 bg-purple-500 text-white"
												: "border-purple-300 text-transparent hover:border-purple-400 hover:text-purple-400"
										} ${todo.status === "pending" ? "cursor-not-allowed" : ""}`}
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

									{todo.status === "pending" && (
										<div className="flex items-center gap-1 text-xs font-medium text-purple-500">
											<Loader2 size={12} className="animate-spin" />
											<span>Syncing...</span>
										</div>
									)}

									<button
										type="button"
										onClick={() => handleRemoveTodo(todo.id)}
										disabled={todo.status === "pending"}
										className="shrink-0 rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
									>
										<Trash2 size={18} />
									</button>
								</div>
							))}
						</div>
					)}
				</div>

				<div className="mt-6 text-center">
					<p className="text-sm text-purple-700/80">
						Built with TanStack Query v5 &bull; useMutationState + Optimistic UI
					</p>
				</div>
			</div>

			<GlobalPendingIndicator />
		</div>
	);
}
