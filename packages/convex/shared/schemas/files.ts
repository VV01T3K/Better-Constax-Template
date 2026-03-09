import { withSystemFields, zid } from "better-convex/server";
import { z } from "zod";

import { fileIdSchema, storageIdSchema } from "./ids";

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_FILE_SIZE_LABEL = `${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`;

export const fileTypeSourceSchema = z.enum(["magic-bytes", "extension", "content-sniff"]);

export const fileShape = {
	userId: zid("user"),
	storageId: zid("_storage"),
	fileName: z.string().trim().min(1, "File name is required"),
	fileType: z.string().trim().min(1, "File type is required"),
	fileSize: z
	.number()
	.int()
	.nonnegative()
	.max(MAX_FILE_SIZE_BYTES, `File size must be ${MAX_FILE_SIZE_LABEL} or less`),
	detectedFileType: z.string().trim().min(1).optional(),
	typeSource: fileTypeSourceSchema.optional(),
};

export const fileDocSchema = z.object(withSystemFields("files", fileShape));

export const fileSchema = {
	list: {
		output: z.array(fileDocSchema.omit({ userId: true, storageId: true })),
	},
	generateUploadUrl: {
		output: z.url(),
	},
	saveFile: {
		input: z.object(fileShape).pick({
			storageId: true,
			fileName: true,
			fileType: true,
			fileSize: true,
			detectedFileType: true,
			typeSource: true,
		}),
	},
	remove: {
		input: z.object({
			id: fileIdSchema,
		}),
	},
} as const;

export const fileInternalSchema = {
	getServeInfo: {
		input: z.object({
			id: fileIdSchema,
		}),
		output: z.object({
			fileName: z.string(),
			fileSize: z.number(),
			fileType: z.string(),
			storageId: storageIdSchema,
		}),
	},
} as const;
