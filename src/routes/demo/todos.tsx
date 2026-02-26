import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { isCRPCClientError } from "better-convex";

import { CreateTodoInputSchema } from "@/lib/schemas";
import { useCRPC } from "@/lib/convex/crpc";

export const Route = createFileRoute("/demo/todos")({
	component: TodosPage,
});

function TodosPage() {
	const crpc = useCRPC();
	const queryClient = useQueryClient();
	const [text, setText] = useState("");
	const [error, setError] = useState<string | null>(null);

	const listQueryOptions = crpc.functions.todos.list.queryOptions({});
	const { data: todos = [], isLoading } = useQuery(listQueryOptions);

	const addTodo = useMutation({
		...crpc.functions.todos.add.mutationOptions(),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: listQueryOptions.queryKey });
		},
	});

	const toggleTodo = useMutation({
		...crpc.functions.todos.toggle.mutationOptions(),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: listQueryOptions.queryKey });
		},
	});

	const removeTodo = useMutation({
		...crpc.functions.todos.remove.mutationOptions(),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: listQueryOptions.queryKey });
		},
	});

	const onAdd = () => {
		setError(null);
		const parsed = CreateTodoInputSchema.safeParse({ text });
		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message ?? "Invalid input.");
			return;
		}

		addTodo.mutate(parsed.data, {
			onSuccess: () => setText(""),
			onError: (cause) => {
				if (isCRPCClientError(cause)) {
					setError(cause.data?.message ?? "Failed to add todo.");
					return;
				}
				setError(cause instanceof Error ? cause.message : "Failed to add todo.");
			},
		});
	};

	return (
		<section className="space-y-4">
			<h1 className="text-2xl font-semibold">Todos</h1>
			<p className="text-sm text-muted-foreground">Public list, owner-only authenticated mutations.</p>

			<div className="flex gap-2">
				<input
					value={text}
					onChange={(event) => setText(event.target.value)}
					placeholder="Add a todo"
					className="w-full rounded-md border border-input bg-background px-3 py-2"
				/>
				<button onClick={onAdd} className="rounded-md bg-primary px-4 py-2 text-primary-foreground">
					Add
				</button>
			</div>
			{error ? <p className="text-sm text-destructive">{error}</p> : null}

			{isLoading ? <p>Loading...</p> : null}
			<ul className="space-y-2">
				{todos.map((todo) => (
					<li key={todo._id} className="flex items-center gap-2 rounded-md border border-border p-2">
						<input
							type="checkbox"
							checked={todo.completed}
							onChange={() => toggleTodo.mutate({ id: todo._id })}
						/>
						<span className={todo.completed ? "line-through text-muted-foreground" : ""}>{todo.text}</span>
						<button
							onClick={() => removeTodo.mutate({ id: todo._id })}
							className="ml-auto rounded-md border border-border px-2 py-1 text-xs"
						>
							Delete
						</button>
					</li>
				))}
			</ul>
		</section>
	);
}
