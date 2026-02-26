import { CRPCError } from "better-convex";
import { getSession } from "better-convex/auth";
import { initCRPC } from "better-convex/server";

import type { DataModel } from "../_generated/dataModel";

const c = initCRPC
	.dataModel<DataModel>()
	.context({
		query: async (ctx) => ({
			session: await getSession(ctx),
		}),
		mutation: async (ctx) => ({
			session: await getSession(ctx),
		}),
	})
	.create();

export const publicQuery = c.query;
export const publicMutation = c.mutation;

export const authQuery = publicQuery.use(async ({ ctx, next }) => {
	const userId =
		ctx.session?.user?.id ??
		ctx.session?.userId ??
		ctx.session?.user?.userId ??
		null;

	if (!userId || typeof userId !== "string") {
		throw new CRPCError({
			code: "UNAUTHORIZED",
			message: "You must be signed in to access this resource.",
		});
	}

	const user = await ctx.db.get(userId as never);
	if (!user) {
		throw new CRPCError({
			code: "UNAUTHORIZED",
			message: "User session is invalid.",
		});
	}

	return next({
		ctx: {
			...ctx,
			userId,
			user,
		},
	});
});

export const authMutation = publicMutation.use(async ({ ctx, next }) => {
	const userId =
		ctx.session?.user?.id ??
		ctx.session?.userId ??
		ctx.session?.user?.userId ??
		null;

	if (!userId || typeof userId !== "string") {
		throw new CRPCError({
			code: "UNAUTHORIZED",
			message: "You must be signed in to perform this action.",
		});
	}

	const user = await ctx.db.get(userId as never);
	if (!user) {
		throw new CRPCError({
			code: "UNAUTHORIZED",
			message: "User session is invalid.",
		});
	}

	return next({
		ctx: {
			...ctx,
			userId,
			user,
		},
	});
});

export const adminQuery = authQuery.use(async ({ ctx, next }) => {
	const role = (ctx.user as { role?: string }).role;
	if (role !== "admin") {
		throw new CRPCError({
			code: "FORBIDDEN",
			message: "Admin access required.",
		});
	}

	return next({
		ctx: {
			...ctx,
			isAdmin: true,
		},
	});
});

export const adminMutation = authMutation.use(async ({ ctx, next }) => {
	const role = (ctx.user as { role?: string }).role;
	if (role !== "admin") {
		throw new CRPCError({
			code: "FORBIDDEN",
			message: "Admin access required.",
		});
	}

	return next({
		ctx: {
			...ctx,
			isAdmin: true,
		},
	});
});
