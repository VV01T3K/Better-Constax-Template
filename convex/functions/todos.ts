import { CRPCError, zid } from "better-convex/server";
import { z } from "zod";

import { protectedMutation, protectedQuery } from "../lib/crpc";

export const list = protectedQuery.input(z.object({})).query(async ({ ctx }) => {
	return await ctx.db
		.query("todos")
		.withIndex("by_user", (q) => q.eq("userId", ctx.userId))
		.order("desc")
		.collect();
});

export const add = protectedMutation
	.input(
		z.object({
			text: z.string(),
		}),
	)
	.mutation(async ({ ctx, input }) => {
		return await ctx.db.insert("todos", {
			text: input.text,
			completed: false,
			userId: ctx.userId,
		});
	});

export const toggle = protectedMutation
	.input(
		z.object({
			id: zid("todos"),
		}),
	)
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

		return await ctx.db.patch(input.id, {
			completed: !todo.completed,
		});
	});

export const remove = protectedMutation
	.input(
		z.object({
			id: zid("todos"),
		}),
	)
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

		return await ctx.db.delete(input.id);
	});
