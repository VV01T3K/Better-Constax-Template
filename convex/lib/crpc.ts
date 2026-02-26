import { CRPCError, initCRPC } from "better-convex/server";

import type { DataModel } from "../functions/_generated/dataModel";

const crpc = initCRPC.dataModel<DataModel>().create();

export const publicQuery = crpc.query;
export const publicMutation = crpc.mutation;
export const publicAction = crpc.action;

export const protectedQuery = crpc.query
	.use(async ({ ctx, next }) => {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			throw new CRPCError({
				code: "UNAUTHORIZED",
				message: "Authentication required",
			});
		}

		return next({
			ctx: {
				...ctx,
				userId: identity.subject,
			},
		});
	})
	.meta({ auth: "required" });

export const protectedMutation = crpc.mutation
	.use(async ({ ctx, next }) => {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			throw new CRPCError({
				code: "UNAUTHORIZED",
				message: "Authentication required",
			});
		}

		return next({
			ctx: {
				...ctx,
				userId: identity.subject,
			},
		});
	})
	.meta({ auth: "required" });

export const protectedAction = crpc.action
	.use(async ({ ctx, next }) => {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			throw new CRPCError({
				code: "UNAUTHORIZED",
				message: "Authentication required",
			});
		}

		return next({
			ctx: {
				...ctx,
				userId: identity.subject,
			},
		});
	})
	.meta({ auth: "required" });
