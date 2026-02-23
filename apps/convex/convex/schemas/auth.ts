import { z } from "zod";

import { authUserIdSchema } from "./ids";

// User profile (stored in database)
export const profileSchema = z.object({
	authUserId: authUserIdSchema,
	name: z.string(),
	email: z.email(),
	image: z.union([z.string(), z.null()]),
});
export type Profile = z.infer<typeof profileSchema>;

// Auth form schemas (client-facing)
export const signUpSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
	email: z.email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const adminUserSchema = z.object({
	id: authUserIdSchema,
	name: z.string().optional(),
	email: z.string().optional(),
	role: z.string().optional(),
	banned: z.boolean().nullable().optional(),
	createdAt: z.union([z.string(), z.date()]).optional(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;

export const adminListUsersResponseSchema = z.object({
	users: z.array(adminUserSchema).default([]),
	total: z.number().optional(),
});
export type AdminListUsersResponse = z.infer<typeof adminListUsersResponseSchema>;
