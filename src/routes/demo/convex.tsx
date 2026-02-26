import type { Doc, Id } from "@convex/dataModel";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Trash2, Plus, Check, Circle, LogOut } from "lucide-react";
import { useCallback, useState } from "react";

import { useSignOutMutationOptions } from "../../integrations/convex/auth-client";
import { useCRPC } from "../../integrations/convex/crpc";
import { getServerAuthState, getServerTodos } from "../../integrations/convex/server-fn";

export const Route = createFileRoute("/demo/convex")({
	beforeLoad: async ({ location }) => {
		const { isAuthenticated } = await getServerAuthState();

		if (!isAuthenticated) {
			throw redirect({
				to: "/auth",
				search: {
					redirect: location.pathname,
				},
			});
		}
	},
	loader: async () => {
		const initialTodos = await getServerTodos();

		return { initialTodos };
	},
	component: ConvexTodos,
});

function ConvexTodos() {
	const { initialTodos } = Route.useLoaderData();
	const crpc = useCRPC();
	const { data: todos = initialTodos, isPending } = useQuery({
		...crpc.func.todos.list.queryOptions({}),
		initialData: initialTodos,
	});
	const { mutateAsync: addTodo } = useMutation(crpc.func.todos.add.mutationOptions());
	const { mutateAsync: toggleTodo } = useMutation(crpc.func.todos.toggle.mutationOptions());
	const { mutateAsync: removeTodo } = useMutation(crpc.func.todos.remove.mutationOptions());
	const { mutateAsync: signOut, isPending: isSigningOut } = useMutation(
		useSignOutMutationOptions({
			onSuccess: () => {
				window.location.assign("/auth?redirect=/demo/convex");
			},
		}),
	);

	const [newTodo, setNewTodo] = useState("");
	const todoItems: Doc<"todos">[] = todos ?? [];

	const handleAddTodo = useCallback(async () => {
		if (newTodo.trim()) {
			await addTodo({ text: newTodo.trim() });
			setNewTodo("");
		}
	}, [addTodo, newTodo]);

	const handleToggleTodo = useCallback(
		async (id: Id<"todos">) => {
			await toggleTodo({ id });
		},
		[toggleTodo],
	);

	const handleRemoveTodo = useCallback(
		async (id: Id<"todos">) => {
			await removeTodo({ id });
		},
		[removeTodo],
	);

	const completedCount = todoItems.filter((todo) => todo.completed).length;
	const totalCount = todoItems.length;

	return (
		<div
			className="flex min-h-screen items-center justify-center p-4"
			style={{
				background:
					"linear-gradient(135deg, #667a56 0%, #8fbc8f 25%, #90ee90 50%, #98fb98 75%, #f0fff0 100%)",
			}}
		>
			<div className="w-full max-w-2xl">
				<div className="mb-6 flex justify-end">
					<button
						type="button"
						onClick={() => signOut()}
						disabled={isSigningOut}
						className="inline-flex items-center gap-2 rounded-lg border border-green-700/40 bg-white/90 px-3 py-2 text-sm font-semibold text-green-800 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
					>
						<LogOut size={16} />
						{isSigningOut ? "Signing out..." : "Sign Out"}
					</button>
				</div>

				{/* Header Card */}
				<div className="mb-6 rounded-2xl border border-green-200/50 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
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
				<div className="mb-6 rounded-2xl border border-green-200/50 bg-white/95 p-6 shadow-xl backdrop-blur-sm">
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
				</div>

				{/* Todos List */}
				<div className="overflow-hidden rounded-2xl border border-green-200/50 bg-white/95 shadow-xl backdrop-blur-sm">
					{isPending ? (
						<div className="p-8 text-center">
							<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-green-500"></div>
							<p className="text-green-600">Loading todos...</p>
						</div>
					) : todoItems.length === 0 ? (
						<div className="p-12 text-center">
							<Circle size={48} className="mx-auto mb-4 text-green-300" />
							<h3 className="mb-2 text-xl font-semibold text-green-800">No todos yet</h3>
							<p className="text-green-600">Add your first todo above to get started!</p>
						</div>
					) : (
						<div className="divide-y divide-green-100">
							{todoItems.map((todo, index) => (
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
						Built with Better Convex • Real-time updates • Always in sync
					</p>
				</div>
			</div>
		</div>
	);
}
