import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

const SEED_TITLES = [
	"Pipeline synchronization completed",
	"Job retry scheduled",
	"Webhook delivery attempted",
	"User-triggered backfill started",
	"Data source connectivity check",
	"Live query warmup executed",
	"Cache compaction cycle",
	"Export bundle prepared",
	"Alert policy evaluated",
	"Background index refresh",
] as const;

const SEED_LEVELS = ["info", "warning", "error"] as const;
const SEED_SOURCES = ["system", "workflow", "integration", "manual"] as const;

async function requireAuthUserId(ctx: {
	auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
}) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new ConvexError({
			code: "UNAUTHORIZED",
			message: "You must be authenticated",
		});
	}
	return identity.subject;
}

function ensureEventOwnership(event: Doc<"events"> | null, userId: string) {
	if (!event || event.userId !== userId) {
		throw new ConvexError({
			code: "NOT_FOUND",
			message: "Event not found",
		});
	}
}

export const listPaginated = query({
	args: {
		archived: v.optional(v.boolean()),
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		const userId = await requireAuthUserId(ctx);
		const archived = args.archived ?? false;

		return await ctx.db
			.query("events")
			.withIndex("by_user_archived_created", (q) => q.eq("userId", userId).eq("archived", archived))
			.order("desc")
			.paginate(args.paginationOpts);
	},
});

export const setStarred = mutation({
	args: {
		id: v.id("events"),
		starred: v.boolean(),
	},
	handler: async (ctx, args) => {
		const userId = await requireAuthUserId(ctx);
		const event = await ctx.db.get(args.id);
		ensureEventOwnership(event, userId);

		await ctx.db.patch(args.id, {
			starred: args.starred,
			updatedAt: Date.now(),
		});
	},
});

export const setArchived = mutation({
	args: {
		id: v.id("events"),
		archived: v.boolean(),
	},
	handler: async (ctx, args) => {
		const userId = await requireAuthUserId(ctx);
		const event = await ctx.db.get(args.id);
		ensureEventOwnership(event, userId);

		await ctx.db.patch(args.id, {
			archived: args.archived,
			updatedAt: Date.now(),
		});
	},
});

export const seed = mutation({
	args: {
		count: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const userId = await requireAuthUserId(ctx);
		const count = Math.max(1, Math.min(Math.floor(args.count ?? 1200), 5000));
		const now = Date.now();

		for (let index = 0; index < count; index += 1) {
			const titleBase = SEED_TITLES[index % SEED_TITLES.length];
			const level = SEED_LEVELS[index % SEED_LEVELS.length];
			const source = SEED_SOURCES[index % SEED_SOURCES.length];
			const createdAt = now - index * 30_000;

			await ctx.db.insert("events", {
				userId,
				title: `${titleBase} #${index + 1}`,
				level,
				source,
				starred: index % 9 === 0,
				archived: index % 17 === 0,
				createdAt,
				updatedAt: createdAt,
			});
		}

		return { created: count };
	},
});
