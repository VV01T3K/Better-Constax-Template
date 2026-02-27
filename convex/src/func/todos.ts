import { assertOwnership, authMiddleware, c } from "../../lib/crpc";
import {
	addTodoInputSchema,
	addTodoOutputSchema,
	emptyMutationOutputSchema,
	listTodosInputSchema,
	listTodosOutputSchema,
	todoToggleInputSchema,
} from "../schemas/app.zod";

export const list = c.query
	.use(authMiddleware)
	.meta({ auth: "required" })
	.input(listTodosInputSchema)
	.output(listTodosOutputSchema)
	.query(async ({ ctx }) => {
		return await ctx.db
			.query("todos")
			.withIndex("by_user", (q) => q.eq("userId", ctx.userId))
			.order("desc")
			.collect();
	});

export const add = c.mutation
	.use(authMiddleware)
	.meta({ auth: "required" })
	.input(addTodoInputSchema)
	.output(addTodoOutputSchema)
	.mutation(async ({ ctx, input }) => {
		return await ctx.db.insert("todos", {
			text: input.text,
			completed: false,
			userId: ctx.userId,
		});
	});

export const toggle = c.mutation
	.use(authMiddleware)
	.meta({ auth: "required" })
	.input(todoToggleInputSchema)
	.output(emptyMutationOutputSchema)
	.mutation(async ({ ctx, input }) => {
		const todo = await assertOwnership(ctx, "todos", input.id);
		await ctx.db.patch(todo._id, { completed: !todo.completed });
		return null;
	});

export const remove = c.mutation
	.use(authMiddleware)
	.meta({ auth: "required" })
	.input(todoToggleInputSchema)
	.output(emptyMutationOutputSchema)
	.mutation(async ({ ctx, input }) => {
		const todo = await assertOwnership(ctx, "todos", input.id);
		await ctx.db.delete(todo._id);
		return null;
	});
