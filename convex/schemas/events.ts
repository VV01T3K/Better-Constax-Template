import { z } from "zod";

export const eventLevelSchema = z.enum(["info", "warning", "error"]);
export const eventSourceSchema = z.enum(["system", "workflow", "integration", "manual"]);

export const eventSchema = z.object({
	userId: z.string(),
	title: z.string().min(1).max(200),
	level: eventLevelSchema,
	source: eventSourceSchema,
	starred: z.boolean(),
	archived: z.boolean(),
	createdAt: z.number(),
	updatedAt: z.number(),
});

export const listEventsInputSchema = z.object({
	archived: z.boolean().optional(),
});

export const seedEventsInputSchema = z.object({
	count: z.number().int().min(1).max(5000).optional(),
});

export type Event = z.infer<typeof eventSchema>;
