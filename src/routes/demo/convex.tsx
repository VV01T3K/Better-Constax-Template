import type { Id } from "@convex/_generated/dataModel";

import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { createTodoSchema } from "@convex/schemas";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Check, Circle, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/demo/convex")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(convexQuery(api.todos.list, {}));
	},
	component: ConvexTodos,
});

function ConvexTodos() {
	const { data: todos } = useSuspenseQuery(convexQuery(api.todos.list, {}));
	const addTodo = useMutation(api.todos.add);
	const toggleTodo = useMutation(api.todos.toggle);
	const removeTodo = useMutation(api.todos.remove);

	const [newTodo, setNewTodo] = useState("");
	const [validationError, setValidationError] = useState<string | null>(null);

	const handleAddTodo = async () => {
		const result = createTodoSchema.safeParse({ text: newTodo.trim() });
		if (!result.success) {
			setValidationError(result.error.issues[0]?.message ?? "Invalid input");
			return;
		}
		setValidationError(null);
		await addTodo({ text: result.data.text });
		setNewTodo("");
	};

	const handleToggleTodo = async (id: Id<"todos">) => {
		await toggleTodo({ id });
	};

	const handleRemoveTodo = async (id: Id<"todos">) => {
		await removeTodo({ id });
	};

	const completedCount = todos.filter((todo) => todo.completed).length;
	const totalCount = todos.length;

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
				<div className="mb-6 rounded-2xl border border-green-200/50 bg-white p-8 shadow-2xl">
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
				<div className="mb-6 rounded-2xl border border-green-200/50 bg-white p-6 shadow-xl">
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
							className="flex-1 rounded-xl border-2 border-green-200 bg-white/80 px-4 py-3 text-gray-800 placeholder-gray-500 transition-colors focus:border-green-400 focus:outline-none"
						/>
						<button
							onClick={handleAddTodo}
							disabled={!newTodo.trim()}
							className="flex items-center gap-2 rounded-xl bg-linear-to-r from-green-500 to-green-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-green-600 hover:to-green-700 hover:shadow-xl disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400"
						>
							<Plus size={20} />
							Add
						</button>
					</div>
					{validationError && <p className="mt-2 text-sm text-red-600">{validationError}</p>}
				</div>

				{/* Todos List */}
				<div className="overflow-hidden rounded-2xl border border-green-200/50 bg-white shadow-xl">
					{todos.length === 0 ? (
						<div className="p-12 text-center">
							<Circle size={48} className="mx-auto mb-4 text-green-300" />
							<h3 className="mb-2 text-xl font-semibold text-green-800">No todos yet</h3>
							<p className="text-green-600">Add your first todo above to get started!</p>
						</div>
					) : (
						<div className="divide-y divide-green-100">
							{todos.map((todo, index) => (
								<div
									key={todo._id}
									className={`flex items-center gap-4 p-4 transition-colors hover:bg-green-50/50 ${
										todo.completed ? "opacity-75" : ""
									}`}
									style={{
										animationDelay: `${index * 50}ms`,
									}}
								>
									<button
										onClick={() => handleToggleTodo(todo._id)}
										className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
											todo.completed
												? "border-green-500 bg-green-500 text-white"
												: "border-green-300 text-transparent hover:border-green-400 hover:text-green-400"
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

									<button
										onClick={() => handleRemoveTodo(todo._id)}
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
					<p className="text-sm text-green-700/80">
						Built with Convex • Real-time updates • Always in sync
					</p>
				</div>
			</div>
		</div>
	);
}
