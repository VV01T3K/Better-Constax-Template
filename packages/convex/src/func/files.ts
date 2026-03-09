import { assertOwnership, authMiddleware, c } from "../../lib/crpc";
import { fileInternalSchema, fileSchema } from "../../shared/schemas/files";
import { parseId } from "../../shared/schemas/ids";

export const list = c.query
	.meta({ auth: "required" })
	.use(authMiddleware)
	.output(fileSchema.list.output)
	.query(async ({ ctx }) => {
		const files = await ctx.db
			.query("files")
			.withIndex("by_user", (q) => q.eq("userId", ctx.userId))
			.order("desc")
			.collect();

		return files.map(({ userId: _userId, storageId: _storageId, ...file }) => file);
	});

export const generateUploadUrl = c.mutation
	.meta({ auth: "required" })
	.use(authMiddleware)
	.output(fileSchema.generateUploadUrl.output)
	.mutation(async ({ ctx }) => {
		return await ctx.storage.generateUploadUrl();
	});

export const saveFile = c.mutation
	.meta({ auth: "required" })
	.use(authMiddleware)
	.input(fileSchema.saveFile.input)
	.mutation(async ({ ctx, input }) => {
		return await ctx.db.insert("files", {
			...input,
			userId: ctx.userId,
		});
	});

export const remove = c.mutation
	.meta({ auth: "required" })
	.use(authMiddleware)
	.input(fileSchema.remove.input)
	.mutation(async ({ ctx, input }) => {
		const file = await assertOwnership(ctx, "files", input.id);
		await ctx.storage.delete(parseId("_storage", file.storageId));
		await ctx.db.delete(file._id);
		return null;
	});

export const getServeInfo = c.query
	.meta({ auth: "required" })
	.use(authMiddleware)
	.internal()
	.input(fileInternalSchema.getServeInfo.input)
	.output(fileInternalSchema.getServeInfo.output)
	.query(async ({ ctx, input }) => {
		const file = await assertOwnership(ctx, "files", input.id);

		return {
			fileName: file.fileName,
			fileSize: file.fileSize,
			fileType: file.fileType,
			storageId: file.storageId,
		};
	});
