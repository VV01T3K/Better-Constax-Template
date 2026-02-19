import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useLiveQuery } from "@tanstack/react-db";
import { Link, createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { createOptimisticTodo, createTodosCollection } from "@/db-collections/todos";

export const Route = createFileRoute("/demo/db-optimistic")({
	component: DbOptimisticRoute,
});

function DbOptimisticRoute() {
	const { convexQueryClient, isAuthenticated, currentUser, queryClient } = useRouteContext({
		from: "__root__",
	});
	const [newTodoText, setNewTodoText] = useState("");
	const [todoError, setTodoError] = useState<string | null>(null);

	const todosClient = useMemo(() => {
		return {
			list: async () => {
				return await convexQueryClient.convexClient.query(api.todos.list, {});
			},
			add: async (input: { text: string }) => {
				return await convexQueryClient.convexClient.mutation(api.todos.add, input);
			},
			setCompleted: async (input: { id: Id<"todos">; completed: boolean }) => {
				await convexQueryClient.convexClient.mutation(api.todos.setCompleted, {
					id: input.id,
					completed: input.completed,
				});
			},
			remove: async (input: { id: Id<"todos"> }) => {
				await convexQueryClient.convexClient.mutation(api.todos.remove, {
					id: input.id,
				});
			},
		};
	}, [convexQueryClient]);

	const todosCollection = useMemo(() => {
		if (!isAuthenticated || !currentUser) {
			return undefined;
		}

		return createTodosCollection({
			queryClient,
			todosClient,
		});
	}, [isAuthenticated, currentUser, queryClient, todosClient]);

	const { data, isLoading, status } = useLiveQuery(() => todosCollection);
	const todos = data ?? [];

	if (!isAuthenticated || !currentUser || !todosCollection) {
		return (
			<div className="mx-auto w-full max-w-3xl px-6 py-16">
				<div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
					<h1 className="mb-3 text-2xl font-semibold text-white">TanStack DB Local-First Demo</h1>
					<p className="text-slate-300">
						Sign in first, then return here to test local-first optimistic updates.
					</p>
					<div className="mt-4 flex gap-3">
						<Link
							to="/app"
							className="rounded-md bg-cyan-500 px-4 py-2 font-medium text-white hover:bg-cyan-600"
						>
							Open /app
						</Link>
						<Link
							to="/"
							className="rounded-md bg-slate-700 px-4 py-2 font-medium text-slate-100 hover:bg-slate-600"
						>
							Back Home
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-5xl px-6 py-12">
			<section className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
				<div className="mb-5 flex items-start justify-between gap-4">
					<div>
						<h1 className="text-2xl font-semibold text-white">Todo (TanStack DB)</h1>
						<p className="text-slate-300">
							Local-first collection with optimistic insert/update/delete and backend persistence.
						</p>
					</div>
					<Link
						to="/app"
						className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
					>
						Standard /app
					</Link>
				</div>

				<form
					className="mb-5 flex gap-2"
					onSubmit={(event) => {
						event.preventDefault();
						const text = newTodoText.trim();
						if (!text) return;

						setTodoError(null);
						const tx = todosCollection.insert(createOptimisticTodo(text));
						setNewTodoText("");
						void tx.isPersisted.promise.catch((error) => {
							setTodoError(getErrorMessage(error));
						});
					}}
				>
					<input
						type="text"
						value={newTodoText}
						onChange={(event) => setNewTodoText(event.target.value)}
						placeholder="Write a todo..."
						className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
					/>
					<button
						type="submit"
						className="rounded-md bg-emerald-500 px-4 py-2 font-medium text-white hover:bg-emerald-600"
					>
						Add
					</button>
				</form>

				{todoError ? (
					<p className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200">
						{todoError}
					</p>
				) : null}

				<div className="mb-4 text-xs text-slate-400">
					Collection status: <span className="font-semibold text-slate-300">{status}</span>
				</div>

				{isLoading ? (
					<p className="text-slate-400">Loading todos...</p>
				) : todos.length === 0 ? (
					<p className="text-slate-400">No todos yet. Add your first one above.</p>
				) : (
					<ul className="space-y-2">
						{todos.map((todo) => (
							<li
								key={todo.id}
								className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2"
							>
								<label className="flex cursor-pointer items-center gap-3">
									<input
										type="checkbox"
										checked={todo.completed}
										disabled={todo.optimistic}
										onChange={() => {
											if (todo.optimistic) return;

											setTodoError(null);
											const tx = todosCollection.update(todo.id, (draft) => {
												draft.completed = !draft.completed;
											});
											void tx.isPersisted.promise.catch((error) => {
												setTodoError(getErrorMessage(error));
											});
										}}
										className="h-4 w-4 accent-emerald-500"
									/>
									<span
										className={todo.completed ? "text-slate-500 line-through" : "text-slate-100"}
									>
										{todo.text}
									</span>
									{todo.optimistic ? (
										<span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] text-amber-200">
											syncing
										</span>
									) : null}
								</label>

								<button
									type="button"
									disabled={todo.optimistic}
									onClick={() => {
										if (todo.optimistic) return;

										setTodoError(null);
										const tx = todosCollection.delete(todo.id);
										void tx.isPersisted.promise.catch((error) => {
											setTodoError(getErrorMessage(error));
										});
									}}
									className="rounded-md bg-slate-800 px-3 py-1 text-sm text-slate-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
								>
									Delete
								</button>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}

function getErrorMessage(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}
	return "Todo operation failed.";
}
