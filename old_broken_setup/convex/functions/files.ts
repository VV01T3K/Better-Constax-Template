import { zid } from "convex-helpers/server/zod4";
import { z } from "zod";

import { requirePermission, throwNotFound, zMutation, zQuery } from "../lib/functionHelpers";

export const generateUploadUrl = zMutation({
	args: {},
	handler: async (ctx) => {
		await requirePermission("demo.files.mutate");
		return await ctx.storage.generateUploadUrl();
	},
});

export const saveFile = zMutation({
	args: {
		storageId: zid("_storage"),
		fileName: z.string().min(1),
		fileType: z.string(),
		fileSize: z.number(),
		detectedFileType: z.optional(z.string()),
		typeSource: z.optional(z.enum(["magic-bytes", "extension", "content-sniff"])),
	},
	handler: async (ctx, args) => {
		await requirePermission("demo.files.mutate");
		return await ctx.db.insert("files", {
			storageId: args.storageId,
			fileName: args.fileName,
			fileType: args.fileType,
			fileSize: args.fileSize,
			detectedFileType: args.detectedFileType,
			typeSource: args.typeSource,
		});
	},
});

export const list = zQuery({
	args: {},
	handler: async (ctx) => {
		await requirePermission("demo.files.access");
		const files = await ctx.db.query("files").order("desc").collect();
		return await Promise.all(
			files.map(async (file) => ({
				...file,
				url: await ctx.storage.getUrl(file.storageId),
			})),
		);
	},
});

export const remove = zMutation({
	args: { id: zid("files") },
	handler: async (ctx, { id }) => {
		await requirePermission("demo.files.mutate");
		const file = await ctx.db.get(id);
		if (!file) {
			throwNotFound("File not found");
		}
		await ctx.storage.delete(file.storageId);
		return await ctx.db.delete(id);
	},
});
