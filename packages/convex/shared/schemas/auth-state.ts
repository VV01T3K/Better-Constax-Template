import { z } from "zod";

export const authStateSchema = {
	me: {
		output: z.union([
			z.null(),
			z.object({
				userId: z.string(),
				name: z.string(),
			}),
		]),
	},
} as const;
