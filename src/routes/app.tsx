import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useRouteContext, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/app")({
	component: AppRoute,
});

function AppRoute() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { isAuthenticated, currentUser } = useRouteContext({ from: "__root__" });

	const [signInEmail, setSignInEmail] = useState("");
	const [signInPassword, setSignInPassword] = useState("");
	const [signUpName, setSignUpName] = useState("");
	const [signUpEmail, setSignUpEmail] = useState("");
	const [signUpPassword, setSignUpPassword] = useState("");
	const [authError, setAuthError] = useState<string | null>(null);
	const [newTodoText, setNewTodoText] = useState("");
	const [todoError, setTodoError] = useState<string | null>(null);

	const todosQueryOptions = convexQuery(api.todos.list, {});

	const todosQuery = useQuery({
		...todosQueryOptions,
		enabled: isAuthenticated,
	});

	const createTodo = useMutation({
		mutationFn: useConvexMutation(api.todos.add),
		onSuccess: async () => {
			setNewTodoText("");
			setTodoError(null);
			await queryClient.invalidateQueries({ queryKey: todosQueryOptions.queryKey });
		},
	});

	const setCompleted = useMutation({
		mutationFn: useConvexMutation(api.todos.setCompleted),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: todosQueryOptions.queryKey });
		},
	});

	const removeTodo = useMutation({
		mutationFn: useConvexMutation(api.todos.remove),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: todosQueryOptions.queryKey });
		},
	});

	if (!isAuthenticated) {
		return (
			<div className="mx-auto grid w-full max-w-5xl gap-6 px-6 py-12 md:grid-cols-2">
				<section className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
					<h1 className="mb-4 text-2xl font-semibold text-white">Sign in</h1>
					<form
						className="space-y-3"
						onSubmit={async (event) => {
							event.preventDefault();
							setAuthError(null);
							await authClient.signIn.email(
								{
									email: signInEmail,
									password: signInPassword,
								},
								{
									onSuccess: async () => {
										await router.invalidate();
									},
									onError: (ctx) => {
										setAuthError(ctx.error.message ?? "Sign in failed");
									},
								},
							);
						}}
					>
						<input
							type="email"
							required
							value={signInEmail}
							onChange={(event) => setSignInEmail(event.target.value)}
							placeholder="Email"
							className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						/>
						<input
							type="password"
							required
							value={signInPassword}
							onChange={(event) => setSignInPassword(event.target.value)}
							placeholder="Password"
							className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						/>
						<button
							type="submit"
							className="rounded-md bg-cyan-500 px-4 py-2 font-medium text-white hover:bg-cyan-600"
						>
							Sign in
						</button>
					</form>
				</section>

				<section className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
					<h2 className="mb-4 text-2xl font-semibold text-white">Create account</h2>
					<form
						className="space-y-3"
						onSubmit={async (event) => {
							event.preventDefault();
							setAuthError(null);
							await authClient.signUp.email(
								{
									name: signUpName,
									email: signUpEmail,
									password: signUpPassword,
								},
								{
									onSuccess: async () => {
										await router.invalidate();
									},
									onError: (ctx) => {
										setAuthError(ctx.error.message ?? "Sign up failed");
									},
								},
							);
						}}
					>
						<input
							type="text"
							required
							value={signUpName}
							onChange={(event) => setSignUpName(event.target.value)}
							placeholder="Name"
							className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						/>
						<input
							type="email"
							required
							value={signUpEmail}
							onChange={(event) => setSignUpEmail(event.target.value)}
							placeholder="Email"
							className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						/>
						<input
							type="password"
							required
							value={signUpPassword}
							onChange={(event) => setSignUpPassword(event.target.value)}
							placeholder="Password"
							className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-white"
						/>
						<button
							type="submit"
							className="rounded-md bg-slate-100 px-4 py-2 font-medium text-slate-900 hover:bg-white"
						>
							Create account
						</button>
					</form>
				</section>

				<section className="md:col-span-2">
					{authError ? (
						<p className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200">
							{authError}
						</p>
					) : null}
					<p className="mt-4 text-sm text-slate-300">
						You are currently signed out. Return to the <Link to="/">landing page</Link>.
					</p>
				</section>
			</div>
		);
	}

	const todos = todosQuery.data ?? [];

	return (
		<div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-12 lg:grid-cols-[1fr_2fr]">
			<section className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
				<h1 className="mb-4 text-2xl font-semibold text-white">Authenticated session</h1>
				<pre className="overflow-x-auto rounded-md bg-slate-950 p-4 text-sm text-cyan-300">
					{JSON.stringify(currentUser, null, 2)}
				</pre>
				<button
					type="button"
					onClick={async () => {
						await authClient.signOut();
						await router.invalidate();
					}}
					className="mt-6 rounded-md bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600"
				>
					Sign out
				</button>
			</section>

			<section className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
				<h2 className="mb-4 text-2xl font-semibold text-white">Todos</h2>
				<div className="mb-4 flex flex-wrap gap-2">
					<Link
						to="/demo/db-optimistic"
						className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
					>
						Open TanStack DB Version
					</Link>
					<Link
						to="/events"
						className="rounded-md bg-cyan-700 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-600"
					>
						Open Events Stream
					</Link>
				</div>
				<form
					className="mb-5 flex gap-2"
					onSubmit={async (event) => {
						event.preventDefault();
						const text = newTodoText.trim();
						if (!text) return;

						setTodoError(null);
						try {
							await createTodo.mutateAsync({ text });
						} catch (error) {
							setTodoError(getErrorMessage(error));
						}
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
						disabled={createTodo.isPending}
						className="rounded-md bg-emerald-500 px-4 py-2 font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
					>
						{createTodo.isPending ? "Adding..." : "Add"}
					</button>
				</form>

				{todoError ? (
					<p className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200">
						{todoError}
					</p>
				) : null}

				{todosQuery.isLoading ? (
					<p className="text-slate-400">Loading todos...</p>
				) : todos.length === 0 ? (
					<p className="text-slate-400">No todos yet. Add your first one above.</p>
				) : (
					<ul className="space-y-2">
						{todos.map((todo) => {
							const isSetting = setCompleted.isPending && setCompleted.variables?.id === todo._id;
							const isRemoving = removeTodo.isPending && removeTodo.variables?.id === todo._id;
							const isBusy = isSetting || isRemoving;

							return (
								<li
									key={todo._id}
									className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2"
								>
									<label className="flex cursor-pointer items-center gap-3">
										<input
											type="checkbox"
											checked={todo.completed}
											disabled={isBusy}
											onChange={async () => {
												setTodoError(null);
												try {
													await setCompleted.mutateAsync({
														id: todo._id,
														completed: !todo.completed,
													});
												} catch (error) {
													setTodoError(getErrorMessage(error));
												}
											}}
											className="h-4 w-4 accent-emerald-500"
										/>
										<span
											className={todo.completed ? "text-slate-500 line-through" : "text-slate-100"}
										>
											{todo.text}
										</span>
									</label>
									<button
										type="button"
										disabled={isBusy}
										onClick={async () => {
											setTodoError(null);
											try {
												await removeTodo.mutateAsync({ id: todo._id });
											} catch (error) {
												setTodoError(getErrorMessage(error));
											}
										}}
										className="rounded-md bg-slate-800 px-3 py-1 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-60"
									>
										Delete
									</button>
								</li>
							);
						})}
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
