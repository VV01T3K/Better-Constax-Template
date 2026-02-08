import { z } from "zod";

export const fileSchema = z.object({
	storageId: z.string(),
	fileName: z.string().min(1, "File name is required"),
	fileType: z.string(),
	fileSize: z.number(),
});
