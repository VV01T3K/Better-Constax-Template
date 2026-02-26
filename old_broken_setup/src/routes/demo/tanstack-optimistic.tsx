import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { createTodoSchema } from "@convex/schemas";
import { useMutationState } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Circle, Loader2, Plus, Trash2, Zap } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useTodosOptimisticTQ } from "@/hooks/useTodosOptimisticTQ";

export const Route = createFileRoute("/demo/tanstack-optimistic")({
	loader: async ({ context }) => {
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
		<div className="fixed right-4 bottom-4 z-50">
			<Badge className="flex items-center gap-2 px-4 py-2">
				<Loader2 className="size-4 animate-spin" />
				{pendingMutations.length} {pendingMutations.length === 1 ? "change" : "changes"} syncing...
			</Badge>
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
		<div className="mx-auto w-full max-w-2xl space-y-6 p-6">
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-3xl">TanStack Query - Optimistic Todos</CardTitle>
					<CardDescription>useMutationState for visual optimism</CardDescription>
					{totalCount > 0 && (
						<div className="text-muted-foreground mt-2 flex justify-center gap-6 text-sm">
							<span>{completedCount} completed</span>
							<span>{totalCount - completedCount} remaining</span>
							{pendingCount > 0 && (
								<span className="text-primary animate-pulse">{pendingCount} syncing...</span>
							)}
						</div>
					)}
				</CardHeader>
			</Card>

			<Alert>
				<Zap className="size-4" />
				<AlertTitle>Zero cache manipulation</AlertTitle>
				<AlertDescription>
					Uses useMutationState to track pending mutations. No onMutate/onError callbacks needed.
				</AlertDescription>
			</Alert>

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
									key={todo.id}
									className={`hover:bg-muted/50 flex items-center gap-4 p-4 transition-all ${
										todo.completed ? "opacity-60" : ""
									} ${todo.status === "pending" ? "opacity-40" : ""}`}
								>
									<Checkbox
										checked={todo.completed}
										onCheckedChange={() => handleToggleTodo(todo.id)}
										disabled={todo.status === "pending"}
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
									{todo.status === "pending" && (
										<Badge variant="secondary" className="gap-1 text-xs">
											<Loader2 className="size-3 animate-spin" />
											Syncing
										</Badge>
									)}
									<Button
										variant="ghost"
										size="icon"
										onClick={() => handleRemoveTodo(todo.id)}
										disabled={todo.status === "pending"}
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
				Built with TanStack Query v5 &bull; useMutationState + Optimistic UI
			</p>

			<GlobalPendingIndicator />
		</div>
	);
}
