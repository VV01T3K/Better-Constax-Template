import { NoOp } from "convex-helpers/server/customFunctions";
import { zCustomQuery, zCustomMutation, zid } from "convex-helpers/server/zod4";
import { ConvexError } from "convex/values";

import { query, mutation } from "./_generated/server";
import { createTodoSchema, todoSchema } from "./schemas";

const zQuery = zCustomQuery(query, NoOp);
const zMutation = zCustomMutation(mutation, NoOp);

export const list = zQuery({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("todos").order("desc").collect();
	},
});

export const add = zMutation({
	args: { text: createTodoSchema.shape.text },
	handler: async (ctx, { text }) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "You must be logged in to add a todo",
			});
		}
		return await ctx.db.insert("todos", {
			text,
			completed: false,
		});
	},
});

export const setCompleted = zMutation({
	args: {
		id: zid("todos"),
		completed: todoSchema.shape.completed,
	},
	handler: async (ctx, { id, completed }) => {
		const todo = await ctx.db.get(id);
		if (!todo) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "Todo not found",
			});
		}
		return await ctx.db.patch(id, {
			completed,
		});
	},
});

export const remove = zMutation({
	args: { id: zid("todos") },
	handler: async (ctx, { id }) => {
		return await ctx.db.delete(id);
	},
});
