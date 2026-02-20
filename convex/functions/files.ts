import { zid } from "convex-helpers/server/zod4";
import { z } from "zod";

import {
	authedMutation,
	authedQuery,
	getAuthUserId,
	getOwnedDocOrThrow,
	requirePermissionForIdentity,
	withIdentity,
} from "../lib/functionHelpers";

export const generateUploadUrl = authedMutation({
	args: {},
	handler: async (ctx) => {
		await requirePermissionForIdentity(ctx, ctx.identity, "demo.files.manage");
		return await ctx.storage.generateUploadUrl();
	},
});

export const saveFile = authedMutation({
	args: {
		storageId: zid("_storage"),
		fileName: z.string().min(1),
		fileType: z.string(),
		fileSize: z.number(),
		detectedFileType: z.optional(z.string()),
		typeSource: z.optional(z.enum(["magic-bytes", "extension", "content-sniff"])),
	},
	handler: withIdentity(async (ctx, args, identity) => {
		await requirePermissionForIdentity(ctx, identity, "demo.files.manage");
		const authUserId = getAuthUserId(identity);
		return await ctx.db.insert("files", {
			authUserId,
			storageId: args.storageId,
			fileName: args.fileName,
			fileType: args.fileType,
			fileSize: args.fileSize,
			detectedFileType: args.detectedFileType,
			typeSource: args.typeSource,
		});
	}),
});

export const list = authedQuery({
	args: {},
	handler: withIdentity(async (ctx, _args, identity) => {
		await requirePermissionForIdentity(ctx, identity, "demo.files.manage");
		const authUserId = getAuthUserId(identity);
		const files = await ctx.db
			.query("files")
			.withIndex("by_authUserId", (q) => q.eq("authUserId", authUserId))
			.order("desc")
			.collect();
		return await Promise.all(
			files.map(async (file) => ({
				...file,
				url: await ctx.storage.getUrl(file.storageId),
			})),
		);
	}),
});

export const remove = authedMutation({
	args: { id: zid("files") },
	handler: withIdentity(async (ctx, { id }, identity) => {
		await requirePermissionForIdentity(ctx, identity, "demo.files.manage");
		const authUserId = getAuthUserId(identity);
		const file = await getOwnedDocOrThrow(ctx, id, { ownerId: authUserId });
		await ctx.storage.delete(file.storageId);
		return await ctx.db.delete(id);
	}),
});
