import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createTodoSchema } from "@convex/schemas";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Check, Circle, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/demo/convex-query")({
	beforeLoad: async ({ context }) => {
		const allowed = await context.queryClient.fetchQuery({
			...convexQuery(api.functions.authorization.hasPermission, {
				permission: "demo.todos.access",
			}),
			staleTime: 0,
		});
		if (!allowed) throw redirect({ to: "/forbidden" });
	},
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(convexQuery(api.functions.todos.list, {}));
	},
	component: ConvexQueryTodos,
});

function ConvexQueryTodos() {
	const { data: todos } = useSuspenseQuery(convexQuery(api.functions.todos.list, {}));

	const { mutate: addTodo } = useMutation({
		mutationFn: useConvexMutation(api.functions.todos.add),
	});
	const { mutate: toggleTodo } = useMutation({
		mutationFn: useConvexMutation(api.functions.todos.toggle),
	});
	const { mutate: removeTodo } = useMutation({
		mutationFn: useConvexMutation(api.functions.todos.remove),
	});

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

	const handleToggleTodo = (id: Id<"todos">) => {
		toggleTodo({ id });
	};

	const handleRemoveTodo = (id: Id<"todos">) => {
		removeTodo({ id });
	};

	const completedCount = todos.filter((todo) => todo.completed).length;
	const totalCount = todos.length;

	return (
		<div className="mx-auto w-full max-w-2xl space-y-6 p-6">
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-3xl">Convex + TanStack Query</CardTitle>
					<CardDescription>Mutations via @tanstack/react-query</CardDescription>
					{totalCount > 0 && (
						<div className="mt-2 flex justify-center gap-6 text-sm text-muted-foreground">
							<span>{completedCount} completed</span>
							<span>{totalCount - completedCount} remaining</span>
						</div>
					)}
				</CardHeader>
			</Card>

			<Card>
				<CardContent className="pt-6">
					<div className="flex gap-3">
						<Input
							value={newTodo}
							onChange={(e) => setNewTodo(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleAddTodo();
								}
							}}
							placeholder="What needs to be done?"
						/>
						<Button onClick={handleAddTodo} disabled={!newTodo.trim()}>
							<Plus className="size-4" />
							Add
						</Button>
					</div>
					{validationError && (
						<p className="mt-2 text-sm text-destructive">{validationError}</p>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardContent className="p-0">
					{todos.length === 0 ? (
						<div className="p-12 text-center">
							<Circle className="mx-auto mb-4 size-12 text-muted-foreground/40" />
							<h3 className="mb-2 text-xl font-semibold">No todos yet</h3>
							<p className="text-muted-foreground">
								Add your first todo above to get started!
							</p>
						</div>
					) : (
						<div className="divide-y divide-border">
							{todos.map((todo) => (
								<div
									key={todo._id}
									className={`flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 ${
										todo.completed ? "opacity-60" : ""
									}`}
								>
									<button
										type="button"
										onClick={() => handleToggleTodo(todo._id)}
										className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
											todo.completed
												? "border-primary bg-primary text-primary-foreground"
												: "border-muted-foreground/40 text-transparent hover:border-primary hover:text-primary"
										}`}
									>
										<Check className="size-3.5" />
									</button>
									<span
										className={`flex-1 text-base ${
											todo.completed
												? "text-muted-foreground line-through"
												: "text-foreground"
										}`}
									>
										{todo.text}
									</span>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => handleRemoveTodo(todo._id)}
										className="text-destructive hover:bg-destructive/10 hover:text-destructive"
									>
										<Trash2 className="size-4" />
									</Button>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<p className="text-center text-sm text-muted-foreground">
				Built with Convex + TanStack Query &bull; useConvexMutation + useMutation
			</p>
		</div>
	);
}
