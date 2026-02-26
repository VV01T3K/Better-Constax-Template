import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createTodoSchema } from "@convex/schemas";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Circle, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/demo/convex-query")({
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
						<div className="text-muted-foreground mt-2 flex justify-center gap-6 text-sm">
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
					{validationError && <p className="text-destructive mt-2 text-sm">{validationError}</p>}
				</CardContent>
			</Card>

			<Card>
				<CardContent className="p-0">
					{todos.length === 0 ? (
						<div className="p-12 text-center">
							<Circle className="text-muted-foreground/40 mx-auto mb-4 size-12" />
							<h3 className="mb-2 text-xl font-semibold">No todos yet</h3>
							<p className="text-muted-foreground">Add your first todo above to get started!</p>
						</div>
					) : (
						<div className="divide-border divide-y">
							{todos.map((todo) => (
								<div
									key={todo._id}
									className={`hover:bg-muted/50 flex items-center gap-4 p-4 transition-colors ${
										todo.completed ? "opacity-60" : ""
									}`}
								>
									<Checkbox
										checked={todo.completed}
										onCheckedChange={() => handleToggleTodo(todo._id)}
										aria-label={`Toggle ${todo.text}`}
										className="rounded-full"
									/>
									<span
										className={`flex-1 text-base ${
											todo.completed ? "text-muted-foreground line-through" : "text-foreground"
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

			<p className="text-muted-foreground text-center text-sm">
				Built with Convex + TanStack Query &bull; useConvexMutation + useMutation
			</p>
		</div>
	);
}
