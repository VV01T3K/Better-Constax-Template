import { z } from "zod";

// ===== TODOS =====
export const todoSchema = z.object({
	text: z.string().min(1, "Text is required"),
	completed: z.boolean(),
});

export const createTodoSchema = todoSchema.pick({ text: true });
export const updateTodoSchema = todoSchema.partial();

// ===== PRODUCTS =====
export const productSchema = z.object({
	title: z.string().min(1, "Title is required"),
	imageId: z.string(),
	price: z.number().positive("Price must be positive"),
});

export const createProductSchema = productSchema;
export const updateProductSchema = productSchema.partial();

// ===== PROFILES =====
export const profileSchema = z.object({
	authUserId: z.string(),
	name: z.string(),
	email: z.email(),
	image: z.union([z.string(), z.null()]),
	createdAt: z.number(),
});

// ===== AUTH FORMS (client-facing) =====
export const signUpSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signInSchema = z.object({
	email: z.email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
});
