import { zid } from "better-convex/server";
import { z } from "zod";

// Shared auth field schemas for client-side form validation.

const auth = z.object({
	userId: zid("user"),
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(100, "Name must be 100 characters or less"),
	email: z.email("Invalid email address").max(254, "Email must be 254 characters or less"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.max(128, "Password must be 128 characters or less"),
});

export const authSchema = {
	me: {
		output: auth.pick({ userId: true, name: true }).nullable(),
	},
	signIn: {
		input: auth.pick({ email: true, password: true }),
	},
	signUp: {
		input: auth.pick({ name: true, email: true, password: true }),
	},
};
