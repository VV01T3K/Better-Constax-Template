import { zid } from "convex-helpers/server/zod4";
import { z } from "zod";

import {
	getAuthUserId,
	requirePermissionForIdentity,
	throwForbidden,
	zMutation,
} from "../lib/functionHelpers";

export const start = zMutation({
	args: {
		targetUserId: z.string(),
		source: z.string().optional(),
		reason: z.string().optional(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throwForbidden("Authentication required");
		}

		await requirePermissionForIdentity(ctx, identity, "admin.users.impersonation.mutate");

		const actorUserId = getAuthUserId(identity);
		if (actorUserId === args.targetUserId) {
			throwForbidden("Cannot impersonate your own account");
		}

		return await ctx.db.insert("impersonationAudit", {
			actorUserId,
			targetUserId: args.targetUserId,
			startedAt: Date.now(),
			endedAt: null,
			source: args.source ?? null,
			reason: args.reason ?? null,
		});
	},
});

export const cancelStart = zMutation({
	args: {
		auditId: zid("impersonationAudit"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throwForbidden("Authentication required");
		}

		await requirePermissionForIdentity(ctx, identity, "admin.users.impersonation.mutate");
		const actorUserId = getAuthUserId(identity);
		const record = await ctx.db.get(args.auditId);
		if (!record) {
			return null;
		}

		if (record.actorUserId !== actorUserId || record.endedAt !== null) {
			throwForbidden("Cannot cancel this audit record");
		}

		await ctx.db.delete(args.auditId);
		return args.auditId;
	},
});

export const stop = zMutation({
	args: {
		targetUserId: z.string(),
		source: z.string().optional(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throwForbidden("Authentication required");
		}

		await requirePermissionForIdentity(ctx, identity, "admin.users.impersonation.mutate");
		const actorUserId = getAuthUserId(identity);
		const openRecord = (
			await ctx.db
				.query("impersonationAudit")
				.withIndex("by_actorUserId_startedAt", (q) => q.eq("actorUserId", actorUserId))
				.order("desc")
				.take(50)
		).find((record) => record.targetUserId === args.targetUserId && record.endedAt === null);

		if (!openRecord) {
			return null;
		}

		await ctx.db.patch(openRecord._id, {
			endedAt: Date.now(),
			source: args.source ?? openRecord.source,
		});
		return openRecord._id;
	},
});
