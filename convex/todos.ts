import { zCustomQuery, zCustomMutation, zid } from "convex-helpers/server/zod4";
import { NoOp } from "convex-helpers/server/customFunctions";
import { ConvexError } from "convex/values";
import { z } from "zod";
import { query, mutation } from "./_generated/server";

const zQuery = zCustomQuery(query, NoOp);
const zMutation = zCustomMutation(mutation, NoOp);

export const list = zQuery({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("todos")
			.withIndex("by_creation_time")
			.order("desc")
			.collect();
	},
});

export const add = zMutation({
	args: { text: z.string().min(1, "Text is required") },
	handler: async (ctx, { text }) => {
		return await ctx.db.insert("todos", {
			text,
			completed: false,
		});
	},
});

export const toggle = zMutation({
	args: { id: zid("todos") },
	handler: async (ctx, { id }) => {
		const todo = await ctx.db.get(id);
		if (!todo) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "Todo not found",
			});
		}
		return await ctx.db.patch(id, {
			completed: !todo.completed,
		});
	},
});

export const remove = zMutation({
	args: { id: zid("todos") },
	handler: async (ctx, { id }) => {
		return await ctx.db.delete(id);
	},
});
