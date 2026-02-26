import { CRPCError, zid } from "better-convex/server";
import { z } from "zod";

import { publicMutation, publicQuery } from "../lib/crpc";
export const list = publicQuery.query(async ({ ctx }) => {
	return await ctx.db.query("todos").withIndex("by_creation_time").order("desc").collect();
});

export const add = publicMutation
	.input(
		z.object({
			text: z.string(),
		}),
	)
	.mutation(async ({ ctx, input }) => {
		return await ctx.db.insert("todos", {
			text: input.text,
			completed: false,
		});
	});

export const toggle = publicMutation
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

		return await ctx.db.patch(input.id, {
			completed: !todo.completed,
		});
	});

export const remove = publicMutation
	.input(
		z.object({
			id: zid("todos"),
		}),
	)
	.mutation(async ({ ctx, input }) => {
		return await ctx.db.delete(input.id);
	});
