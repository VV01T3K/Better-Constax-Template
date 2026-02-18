import { z } from "zod";

export const productSchema = z.object({
	title: z.string().min(1, "Title is required"),
	imageId: z.string(),
	price: z.number().positive("Price must be positive"),
});

export const createProductSchema = productSchema;
export const updateProductSchema = productSchema.partial();
