import { todoSchema } from "@repo/convex/schemas/todos";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { Item, ItemActions, ItemContent, ItemTitle } from "@repo/ui/components/item";
import { useForm } from "@tanstack/react-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Circle, Plus, Trash2 } from "lucide-react";

import { staticCRPC, useCRPC } from "../../../../integrations/convex/crpc";

export const Route = createFileRoute("/_app/_authenticated/demo/convex")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(staticCRPC.func.todos.list.staticQueryOptions({}));
	},
	component: ConvexTodos,
});

function ConvexTodos() {
	const c = useCRPC();
	const { data: todos, isFetching } = useSuspenseQuery(c.func.todos.list.queryOptions({}));
	const { mutateAsync: addTodo } = useMutation(c.func.todos.add.mutationOptions());
	const { mutateAsync: toggleTodo } = useMutation(c.func.todos.toggle.mutationOptions());
	const { mutateAsync: removeTodo } = useMutation(c.func.todos.remove.mutationOptions());

	const completedCount = todos.filter((todo) => todo.completed).length;
	const totalCount = todos.length;

	const form = useForm({
		defaultValues: {
			text: "",
		},
		validators: {
			onMount: todoSchema.add.input,
			onChange: todoSchema.add.input,
		},
		onSubmit: async ({ value, formApi }) => {
			await addTodo(todoSchema.add.input.parse(value));
			formApi.reset();
		},
	});

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<div className="w-full max-w-2xl">
				{/* Header Card */}
				<Card className="mb-6">
					<CardHeader className="text-center">
						<CardTitle className="text-4xl font-bold">Convex Todos</CardTitle>
						<CardDescription className="text-lg">Powered by real-time sync</CardDescription>
					</CardHeader>
					{totalCount > 0 && (
						<CardContent>
							<div className="flex justify-center space-x-6 text-sm">
								<span className="text-primary font-medium">{completedCount} completed</span>
								<span className="text-muted-foreground">
									{totalCount - completedCount} remaining
								</span>
							</div>
						</CardContent>
					)}
				</Card>

				{/* Add Todo Card */}
				<Card className="mb-6">
					<CardContent>
						<form
							className="flex gap-3"
							onSubmit={(e) => {
								e.preventDefault();
								void form.handleSubmit();
							}}
						>
							<form.Field name="text">
								{(field) => (
									<Input
										type="text"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										placeholder="What needs to be done?"
										className="flex-1"
									/>
								)}
							</form.Field>
							<form.Subscribe
								selector={(state) =>
									[state.values.text, state.canSubmit, state.isSubmitting] as const
								}
							>
								{([text, canSubmit, isSubmitting]) => (
									<Button type="submit" disabled={!text.trim() || !canSubmit || isSubmitting}>
										<Plus size={20} />
										Add
									</Button>
								)}
							</form.Subscribe>
						</form>
					</CardContent>
				</Card>

				{/* Todos List */}
				<Card>
					{todos.length === 0 ? (
						<CardContent className="p-12 text-center">
							<Circle size={48} strokeWidth={2} className="text-muted-foreground mx-auto mb-4" />
							<h3 className="text-card-foreground mb-2 text-xl font-semibold">No todos yet</h3>
							<p className="text-muted-foreground">Add your first todo above to get started!</p>
						</CardContent>
					) : (
						<CardContent className="flex flex-col gap-0">
							{todos.map((todo) => (
								<Item
									key={todo._id}
									variant="outline"
									className={todo.completed ? "opacity-75" : ""}
								>
									<Checkbox
										checked={todo.completed}
										onCheckedChange={() => void toggleTodo({ id: todo._id })}
										aria-label={todo.completed ? "Mark as incomplete" : "Mark as complete"}
									/>
									<ItemContent>
										<ItemTitle
											className={todo.completed ? "text-muted-foreground line-through" : ""}
										>
											{todo.text}
										</ItemTitle>
									</ItemContent>
									<ItemActions>
										<Button
											variant="destructive"
											size="icon-xs"
											onClick={() => void removeTodo({ id: todo._id })}
										>
											<Trash2 size={18} />
										</Button>
									</ItemActions>
								</Item>
							))}
						</CardContent>
					)}
				</Card>

				{/* Footer */}
				<div className="mt-6 text-center">
					<p className="text-muted-foreground text-sm">
						Built with Better Convex • Real-time updates • Always in sync
					</p>
				</div>

				{isFetching && (
					<p className="text-muted-foreground mt-3 text-center text-xs font-medium">Syncing...</p>
				)}
			</div>
		</div>
	);
}
