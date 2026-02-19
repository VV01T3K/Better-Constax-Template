import { NoOp } from "convex-helpers/server/customFunctions";
import { zCustomMutation, zCustomQuery, zid } from "convex-helpers/server/zod4";
import { ConvexError } from "convex/values";
import { z } from "zod";

import { mutation, query } from "../_generated/server";

const zQuery = zCustomQuery(query, NoOp);
const zMutation = zCustomMutation(mutation, NoOp);

export const generateUploadUrl = zMutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "You must be logged in to upload files",
			});
		}
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
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "You must be logged in to save files",
			});
		}
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
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "You must be logged in to list files",
			});
		}

		const files = await ctx.db.query("files").withIndex("by_creation_time").order("desc").collect();
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
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "You must be logged in to delete files",
			});
		}

		const file = await ctx.db.get(id);
		if (!file) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "File not found",
			});
		}
		await ctx.storage.delete(file.storageId);
		return await ctx.db.delete(id);
	},
});
