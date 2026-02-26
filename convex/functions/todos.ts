import { CRPCError } from "better-convex";
import { z } from "zod";

import {
	CreateTodoInputSchema,
	OperationSuccessSchema,
	TodoDocSchema,
	ToggleTodoInputSchema,
} from "../../src/lib/schemas";
import { authMutation, publicQuery } from "../lib/crpc";

export const list = publicQuery
	.input(z.object({}))
	.output(z.array(TodoDocSchema))
	.query(async ({ ctx }) => {
		return await ctx.db.query("todos").order("desc").collect();
	});

export const add = authMutation
	.input(CreateTodoInputSchema)
	.output(TodoDocSchema)
	.mutation(async ({ ctx, input }) => {
		const id = await ctx.db.insert("todos", {
			text: input.text,
			completed: false,
			ownerUserId: ctx.userId,
		});
		const created = await ctx.db.get(id);
		if (!created) {
			throw new CRPCError({ code: "NOT_FOUND", message: "Created todo not found." });
		}
		return created;
	});

export const toggle = authMutation
	.input(ToggleTodoInputSchema)
	.output(TodoDocSchema)
	.mutation(async ({ ctx, input }) => {
		const todo = await ctx.db.get(input.id as never);
		if (!todo) {
			throw new CRPCError({ code: "NOT_FOUND", message: "Todo not found." });
		}
		if (String(todo.ownerUserId) !== ctx.userId) {
			throw new CRPCError({ code: "FORBIDDEN", message: "You can only update your own todos." });
		}

		await ctx.db.patch(input.id as never, { completed: !todo.completed });
		const updated = await ctx.db.get(input.id as never);
		if (!updated) {
			throw new CRPCError({ code: "NOT_FOUND", message: "Updated todo not found." });
		}
		return updated;
	});

export const remove = authMutation
	.input(ToggleTodoInputSchema)
	.output(OperationSuccessSchema)
	.mutation(async ({ ctx, input }) => {
		const todo = await ctx.db.get(input.id as never);
		if (!todo) {
			throw new CRPCError({ code: "NOT_FOUND", message: "Todo not found." });
		}
		if (String(todo.ownerUserId) !== ctx.userId) {
			throw new CRPCError({ code: "FORBIDDEN", message: "You can only delete your own todos." });
		}

		await ctx.db.delete(input.id as never);
		return { success: true };
	});
