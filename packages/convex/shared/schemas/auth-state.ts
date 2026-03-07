import { z } from "zod";

export const authStateSchema = {
	me: {
		output: z
			.object({
				userId: z.string(),
				name: z.string(),
			})
			.nullable(),
	},
} as const;
