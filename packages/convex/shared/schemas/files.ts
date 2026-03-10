import { zid } from "better-convex/server";
import { z } from "zod";

import { zodTable } from "../../lib/zodHelpers";

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_FILE_SIZE_LABEL = `${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`;

export const file = zodTable("files", {
	userId: zid("user"),
	storageId: zid("_storage"),
	fileName: z
		.string()
		.trim()
		.min(1, "File name is required")
		.max(255, "File name must be 255 characters or less"),
	fileType: z
		.string()
		.trim()
		.min(1, "File type is required")
		.max(127, "File type must be 127 characters or less")
		.regex(/^[\w.+-]+\/[\w.+-]+$/, "File type must be a valid MIME type"),
	fileSize: z
		.number()
		.int("File size must be a whole number")
		.nonnegative("File size must not be negative")
		.max(MAX_FILE_SIZE_BYTES, `File size must be ${MAX_FILE_SIZE_LABEL} or less`),
	detectedFileType: z
		.string()
		.trim()
		.min(1, "Detected file type must not be empty")
		.max(20, "Detected file type must be 20 characters or less")
		.optional(),
	typeSource: z.enum(["magic-bytes", "extension", "content-sniff"]).optional(),
});

export const fileSchema = {
	list: {
		output: z.array(file.omit({ userId: true, storageId: true })),
	},
	generateUploadUrl: {
		output: z.url(),
	},
	saveFile: {
		input: file.pick({
			storageId: true,
			fileName: true,
			fileType: true,
			fileSize: true,
			detectedFileType: true,
			typeSource: true,
		}),
	},
	remove: {
		input: file.pick({ _id: true }),
	},
} as const;

export const fileInternalSchema = {
	getServeInfo: {
		input: file.pick({ _id: true }),
		output: file.pick({ fileName: true, fileSize: true, fileType: true, storageId: true }),
	},
} as const;
