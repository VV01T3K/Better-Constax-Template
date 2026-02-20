import { zid } from "convex-helpers/server/zod4";
import { z } from "zod";

import {
	authedMutation,
	authedQuery,
	getOwnedDocOrThrow,
	withIdentity,
} from "../lib/functionHelpers";

export const list = authedQuery({
	args: {},
	handler: withIdentity(async (ctx, _args, identity) => {
		return await ctx.db
			.query("todos")
			.withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
			.order("desc")
			.collect();
	}),
});

export const add = authedMutation({
	args: { text: z.string().min(1, "Text is required") },
	handler: withIdentity(async (ctx, { text }, identity) => {
		return await ctx.db.insert("todos", {
			authUserId: identity.subject,
			text,
			completed: false,
		});
	}),
});

export const toggle = authedMutation({
	args: { id: zid("todos") },
	handler: withIdentity(async (ctx, { id }, identity) => {
		const todo = await getOwnedDocOrThrow(ctx, id, { ownerId: identity.subject });
		return await ctx.db.patch(id, {
			completed: !todo.completed,
		});
	}),
});

export const remove = authedMutation({
	args: { id: zid("todos") },
	handler: withIdentity(async (ctx, { id }, identity) => {
		await getOwnedDocOrThrow(ctx, id, { ownerId: identity.subject });
		return await ctx.db.delete(id);
	}),
});
