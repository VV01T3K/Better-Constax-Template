import { zid } from "convex-helpers/server/zod4";
import { z } from "zod";

export const fileSchema = z.object({
	authUserId: z.string(),
	storageId: zid("_storage"),
	fileName: z.string().min(1, "File name is required"),
	fileType: z.string(),
	fileSize: z.number(),
	detectedFileType: z.optional(z.string()),
	typeSource: z.optional(z.enum(["magic-bytes", "extension", "content-sniff"])),
});
