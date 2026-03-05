import { z } from "zod";

// Shared auth field schemas for client-side form validation.

export const authFields = {
	name: z.string().trim().min(1, "Name is required"),
	email: z.email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
};

export const signInSchema = z.object({
	email: authFields.email,
	password: authFields.password,
});

export const signUpSchema = z.object({
	name: authFields.name,
	email: authFields.email,
	password: authFields.password,
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
