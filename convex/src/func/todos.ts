import { CRPCError } from "better-convex/server";

import { protectedMutation, protectedQuery } from "../../lib/crpc";
import {
	addTodoInputSchema,
	addTodoOutputSchema,
	emptyMutationOutputSchema,
	listTodosInputSchema,
	listTodosOutputSchema,
	todoIdInputSchema,
} from "../schemas/app.zod";

export const list = protectedQuery
	.input(listTodosInputSchema)
	.output(listTodosOutputSchema)
	.query(async ({ ctx }) => {
		return await ctx.db
			.query("todos")
			.withIndex("by_user", (q) => q.eq("userId", ctx.userId))
			.order("desc")
			.collect();
	});

export const add = protectedMutation
	.input(addTodoInputSchema)
	.output(addTodoOutputSchema)
	.mutation(async ({ ctx, input }) => {
		return await ctx.db.insert("todos", {
			text: input.text,
			completed: false,
			userId: ctx.userId,
		});
	});

export const toggle = protectedMutation
	.input(todoIdInputSchema)
	.output(emptyMutationOutputSchema)
	.mutation(async ({ ctx, input }) => {
		const todo = await ctx.db.get(input.id);

		if (!todo) {
			throw new CRPCError({
				code: "NOT_FOUND",
				message: "Todo not found",
			});
		}

		if (todo.userId !== ctx.userId) {
			throw new CRPCError({
				code: "FORBIDDEN",
				message: "Cannot modify another user's todo",
			});
		}

		await ctx.db.patch(input.id, {
			completed: !todo.completed,
		});
		return null;
	});

export const remove = protectedMutation
	.input(todoIdInputSchema)
	.output(emptyMutationOutputSchema)
	.mutation(async ({ ctx, input }) => {
		const todo = await ctx.db.get(input.id);

		if (!todo) {
			throw new CRPCError({
				code: "NOT_FOUND",
				message: "Todo not found",
			});
		}

		if (todo.userId !== ctx.userId) {
			throw new CRPCError({
				code: "FORBIDDEN",
				message: "Cannot delete another user's todo",
			});
		}

		await ctx.db.delete(input.id);
		return null;
	});
