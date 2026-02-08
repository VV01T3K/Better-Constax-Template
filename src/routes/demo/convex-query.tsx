import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Circle, Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { createTodoSchema } from "../../../convex/schemas";

export const Route = createFileRoute("/demo/convex-query")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(convexQuery(api.todos.list, {}));
	},
	component: ConvexQueryTodos,
});

function ConvexQueryTodos() {
	const { data: todos } = useSuspenseQuery(convexQuery(api.todos.list, {}));

	const { mutate: addTodo } = useMutation({
		mutationFn: useConvexMutation(api.todos.add),
	});
	const { mutate: toggleTodo } = useMutation({
		mutationFn: useConvexMutation(api.todos.toggle),
	});
	const { mutate: removeTodo } = useMutation({
		mutationFn: useConvexMutation(api.todos.remove),
	});

	const [newTodo, setNewTodo] = useState("");
	const [validationError, setValidationError] = useState<string | null>(null);

	const handleAddTodo = useCallback(() => {
		const result = createTodoSchema.safeParse({ text: newTodo.trim() });
		if (!result.success) {
			setValidationError(result.error.issues[0]?.message ?? "Invalid input");
			return;
		}
		setValidationError(null);
		addTodo({ text: result.data.text });
		setNewTodo("");
	}, [addTodo, newTodo]);

	const handleToggleTodo = useCallback(
		(id: Id<"todos">) => {
			toggleTodo({ id });
		},
		[toggleTodo],
	);

	const handleRemoveTodo = useCallback(
		(id: Id<"todos">) => {
			removeTodo({ id });
		},
		[removeTodo],
	);

	const completedCount = todos.filter((todo) => todo.completed).length;
	const totalCount = todos.length;

	return (
		<div
			className="min-h-screen flex items-center justify-center p-4"
			style={{
				background:
					"linear-gradient(135deg, #4a3f8a 0%, #6366f1 25%, #818cf8 50%, #a5b4fc 75%, #eef2ff 100%)",
			}}
		>
			<div className="w-full max-w-2xl">
				{/* Header Card */}
				<div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-indigo-200/50 p-8 mb-6">
					<div className="text-center">
						<h1 className="text-4xl font-bold text-indigo-800 mb-2">
							Convex + TanStack Query
						</h1>
						<p className="text-indigo-600 text-lg">
							Mutations via @tanstack/react-query
						</p>
						{totalCount > 0 && (
							<div className="mt-4 flex justify-center space-x-6 text-sm">
								<span className="text-indigo-700 font-medium">
									{completedCount} completed
								</span>
								<span className="text-gray-600">
									{totalCount - completedCount} remaining
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Add Todo Card */}
				<div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-indigo-200/50 p-6 mb-6">
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
							className="flex-1 px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-400 focus:outline-none text-gray-800 placeholder-gray-500 bg-white/80 transition-colors"
						/>
						<button
							onClick={handleAddTodo}
							disabled={!newTodo.trim()}
							className="bg-linear-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
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
				<div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-indigo-200/50 overflow-hidden">
					{todos.length === 0 ? (
						<div className="p-12 text-center">
							<Circle size={48} className="text-indigo-300 mx-auto mb-4" />
							<h3 className="text-xl font-semibold text-indigo-800 mb-2">
								No todos yet
							</h3>
							<p className="text-indigo-600">
								Add your first todo above to get started!
							</p>
						</div>
					) : (
						<div className="divide-y divide-indigo-100">
							{todos.map((todo, index) => (
								<div
									key={todo._id}
									className={`p-4 flex items-center gap-4 hover:bg-indigo-50/50 transition-colors ${
										todo.completed ? "opacity-75" : ""
									}`}
									style={{
										animationDelay: `${index * 50}ms`,
									}}
								>
									<button
										onClick={() => handleToggleTodo(todo._id)}
										className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
											todo.completed
												? "bg-indigo-500 border-indigo-500 text-white"
												: "border-indigo-300 hover:border-indigo-400 text-transparent hover:text-indigo-400"
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

									<button
										onClick={() => handleRemoveTodo(todo._id)}
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
					<p className="text-indigo-700/80 text-sm">
						Built with Convex + TanStack Query &bull; useConvexMutation +
						useMutation
					</p>
				</div>
			</div>
		</div>
	);
}
