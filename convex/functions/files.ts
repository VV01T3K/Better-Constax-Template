import { CRPCError } from "better-convex";
import { z } from "zod";

import {
	FileWithUrlSchema,
	OperationSuccessSchema,
	RemoveFileInputSchema,
	SaveFileInputSchema,
} from "../../src/lib/schemas";
import { authMutation, publicQuery } from "../lib/crpc";

export const generateUploadUrl = authMutation
	.input(z.object({}))
	.output(z.string())
	.mutation(async ({ ctx }) => {
		return await ctx.storage.generateUploadUrl();
	});

export const saveFile = authMutation
	.input(SaveFileInputSchema)
	.output(z.object({ id: z.string() }))
	.mutation(async ({ ctx, input }) => {
		const id = await ctx.db.insert("files", {
			storageId: input.storageId as never,
			fileName: input.fileName,
			fileType: input.fileType,
			fileSize: input.fileSize,
			detectedFileType: input.detectedFileType,
			typeSource: input.typeSource,
			ownerUserId: ctx.userId,
		});
		return { id: String(id) };
	});

export const list = publicQuery
	.input(z.object({}))
	.output(z.array(FileWithUrlSchema))
	.query(async ({ ctx }) => {
		const files = await ctx.db.query("files").order("desc").collect();
		return await Promise.all(
			files.map(async (file) => ({
				...file,
				url: await ctx.storage.getUrl(file.storageId),
			})),
		);
	});

export const remove = authMutation
	.input(RemoveFileInputSchema)
	.output(OperationSuccessSchema)
	.mutation(async ({ ctx, input }) => {
		const file = await ctx.db.get(input.id as never);
		if (!file) {
			throw new CRPCError({ code: "NOT_FOUND", message: "File not found." });
		}
		if (String(file.ownerUserId) !== ctx.userId) {
			throw new CRPCError({ code: "FORBIDDEN", message: "You can only delete your own files." });
		}

		await ctx.storage.delete(file.storageId);
		await ctx.db.delete(input.id as never);

		return { success: true };
	});
