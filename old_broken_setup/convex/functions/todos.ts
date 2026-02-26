import { zid } from "convex-helpers/server/zod4";
import { z } from "zod";

import { requirePermission, throwNotFound, zMutation, zQuery } from "../lib/functionHelpers";

export const list = zQuery({
	args: {},
	handler: async (ctx) => {
		await requirePermission("demo.todos.access");
		return await ctx.db.query("todos").order("desc").collect();
	},
});

export const add = zMutation({
	args: { text: z.string().min(1, "Text is required") },
	handler: async (ctx, { text }) => {
		await requirePermission("demo.todos.mutate");
		return await ctx.db.insert("todos", {
			text,
			completed: false,
		});
	},
});

export const toggle = zMutation({
	args: { id: zid("todos") },
	handler: async (ctx, { id }) => {
		await requirePermission("demo.todos.mutate");
		const todo = await ctx.db.get(id);
		if (!todo) {
			throwNotFound("Todo not found");
		}
		return await ctx.db.patch(id, {
			completed: !todo.completed,
		});
	},
});

export const remove = zMutation({
	args: { id: zid("todos") },
	handler: async (ctx, { id }) => {
		await requirePermission("demo.todos.mutate");
		return await ctx.db.delete(id);
	},
});
