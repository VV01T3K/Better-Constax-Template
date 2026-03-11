import * as z from "zod";

import { zodTable } from "../../lib/zodHelpers";
import {
	PAGINATION_DEMO_PAGE_SIZE,
	PAGINATION_DEMO_PAGE_SIZE_OPTIONS,
	PAGINATION_DEMO_SEED_COUNT,
	type PaginationDemoPageSize,
} from "./pagination-demo.constants";

export { PAGINATION_DEMO_PAGE_SIZE, PAGINATION_DEMO_PAGE_SIZE_OPTIONS, PAGINATION_DEMO_SEED_COUNT };
export type { PaginationDemoPageSize };

export const paginationDemoRegionValues = ["NA", "EU", "APAC", "LATAM", "MEA"] as const;
export const paginationDemoStatusValues = ["active", "idle", "paused", "error"] as const;

export const paginationDemo = zodTable("paginationDemoItems", {
	position: z
		.number()
		.int("Position must be a whole number")
		.nonnegative("Position must not be negative"),
	name: z.string().trim().min(1, "Name is required").max(80, "Name must be 80 characters or less"),
	region: z.enum(paginationDemoRegionValues),
	status: z.enum(paginationDemoStatusValues),
	score: z.number().int("Score must be a whole number").nonnegative("Score must not be negative"),
	throughput: z
		.number()
		.int("Throughput must be a whole number")
		.nonnegative("Throughput must not be negative"),
	latencyMs: z
		.number()
		.int("Latency must be a whole number")
		.nonnegative("Latency must not be negative"),
	updatedAt: z
		.number()
		.int("Updated timestamp must be a whole number")
		.nonnegative("Updated timestamp must not be negative"),
});

export const paginationDemoListItemSchema = paginationDemo;
export const paginationDemoSeedItemSchema = paginationDemo.omit({
	_id: true,
	_creationTime: true,
});
const paginationDemoPageSizeSchema = z.union([
	z.literal(50),
	z.literal(100),
	z.literal(200),
	z.literal(500),
	z.literal(1000),
	z.literal(2000),
]);

const paginationDemoRegions = [...paginationDemoRegionValues];
const paginationDemoStatuses = [...paginationDemoStatusValues];

function seeded(index: number, salt: number) {
	const value = (index * 9301 + salt * 49297 + 233280) % 233280;
	return value / 233280;
}

function pickFrom<T>(values: readonly T[], index: number, salt: number): T {
	const pickedIndex = Math.floor(seeded(index, salt) * values.length);
	return values[pickedIndex] ?? values[0];
}

export function buildPaginationDemoSeedItem(position: number) {
	const score = Math.floor(seeded(position, 11) * 10_000);
	const throughput = Math.floor(seeded(position, 17) * 2_000);
	const latencyMs = 20 + Math.floor(seeded(position, 29) * 480);
	const updatedAt = Date.UTC(2026, 2, 10, 18, 0, 0) - position * 30_000;

	return paginationDemoSeedItemSchema.parse({
		position,
		name: `Record-${String(position).padStart(7, "0")}`,
		region: pickFrom(paginationDemoRegions, position, 5),
		status: pickFrom(paginationDemoStatuses, position, 7),
		score,
		throughput,
		latencyMs,
		updatedAt,
	});
}

export const paginationDemoSeedRows = Array.from(
	{ length: PAGINATION_DEMO_SEED_COUNT },
	(_, index) => buildPaginationDemoSeedItem(index),
);

export const paginationDemoSchema = {
	list: {
		output: z.object({
			continueCursor: z.string().nullable(),
			isDone: z.boolean(),
			page: z.array(paginationDemoListItemSchema),
		}),
	},
	listPage: {
		input: z.object({
			page: z.number().int().nonnegative(),
			pageSize: paginationDemoPageSizeSchema,
		}),
		output: z.object({
			page: z.array(paginationDemoListItemSchema),
			pageIndex: z.number().int().nonnegative(),
			pageSize: paginationDemoPageSizeSchema,
			totalPages: z.number().int().positive(),
			totalRows: z.number().int().nonnegative(),
		}),
	},
} as const;

export type PaginationDemoSeedItem = z.infer<typeof paginationDemoSeedItemSchema>;
export type PaginationDemoItem = z.infer<typeof paginationDemoListItemSchema>;
