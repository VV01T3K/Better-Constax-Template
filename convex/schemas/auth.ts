import { z } from "zod";

// User profile (stored in database)
export const profileSchema = z.object({
	authUserId: z.string(),
	name: z.string(),
	email: z.email(),
	image: z.union([z.string(), z.null()]),
	createdAt: z.number(),
});

// Auth form schemas (client-facing)
export const signUpSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signInSchema = z.object({
	email: z.email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
});
