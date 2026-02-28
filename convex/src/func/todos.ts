import { assertOwnership, authMiddleware, c } from "../../lib/crpc";
import { todoSchema } from "../../shared/schemas/todos";

export const list = c.query
	.meta({ auth: "required" })
	.use(authMiddleware)
	.output(todoSchema.list.output)
	.query(async ({ ctx }) => {
		return await ctx.db
			.query("todos")
			.withIndex("by_user", (q) => q.eq("userId", ctx.userId))
			.order("desc")
			.collect();
	});

export const add = c.mutation
	.meta({ auth: "required" })
	.use(authMiddleware)
	.input(todoSchema.add.input)
	.output(todoSchema.add.output)
	.mutation(async ({ ctx, input }) => {
		return await ctx.db.insert("todos", {
			text: input.text,
			completed: false,
			userId: ctx.userId,
		});
	});

export const toggle = c.mutation
	.meta({ auth: "required" })
	.use(authMiddleware)
	.input(todoSchema.toggle.input)
	.mutation(async ({ ctx, input }) => {
		const todo = await assertOwnership(ctx, "todos", input.id);
		await ctx.db.patch(todo._id, { completed: !todo.completed });
		return null;
	});

export const remove = c.mutation
	.meta({ auth: "required" })
	.use(authMiddleware)
	.input(todoSchema.remove.input)
	.mutation(async ({ ctx, input }) => {
		const todo = await assertOwnership(ctx, "todos", input.id);
		await ctx.db.delete(todo._id);
		return null;
	});
