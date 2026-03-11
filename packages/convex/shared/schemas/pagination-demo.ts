import * as z from "zod";

import { zodTable } from "../../lib/zodHelpers";

export const PAGINATION_DEMO_SEED_COUNT = 1200;
export const PAGINATION_DEMO_PAGE_SIZE = 40;

export const paginationDemoCategoryValues = ["filing", "audit", "payroll", "invoice"] as const;
export const paginationDemoStatusValues = ["queued", "review", "ready"] as const;

export const paginationDemo = zodTable("paginationDemoItems", {
	position: z
		.number()
		.int("Position must be a whole number")
		.nonnegative("Position must not be negative"),
	title: z
		.string()
		.trim()
		.min(1, "Title is required")
		.max(120, "Title must be 120 characters or less"),
	category: z.enum(paginationDemoCategoryValues),
	status: z.enum(paginationDemoStatusValues),
	summary: z
		.string()
		.trim()
		.min(1, "Summary is required")
		.max(280, "Summary must be 280 characters or less"),
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

const paginationDemoTitles = {
	filing: [
		"Q1 state filing batch",
		"Entity renewal packet",
		"Nexus registration review",
		"Sales tax closeout run",
	] as const,
	audit: [
		"Invoice exception sweep",
		"Cross-border reconciliation",
		"Reserve variance audit",
		"Merchant evidence review",
	] as const,
	payroll: [
		"Payroll liability pass",
		"Contractor withholding check",
		"Benefits accrual sync",
		"Net pay anomaly review",
	] as const,
	invoice: [
		"Billing correction queue",
		"Credit memo validation",
		"Subscription proration pass",
		"Deferred revenue release",
	] as const,
} satisfies Record<(typeof paginationDemoCategoryValues)[number], readonly string[]>;

const paginationDemoCategories = [...paginationDemoCategoryValues];
const paginationDemoStatuses = [...paginationDemoStatusValues];
const paginationDemoPrefixes = [
	"Northwind",
	"Beacon",
	"Atlas",
	"Signal",
	"Summit",
	"Meridian",
	"Harbor",
	"Kepler",
	"Lumen",
	"Orion",
] as const;

function seeded(index: number, salt: number) {
	const value = (index * 9301 + salt * 49297 + 233280) % 233280;
	return value / 233280;
}

function pickFrom<T>(values: readonly T[], index: number, salt: number): T {
	const pickedIndex = Math.floor(seeded(index, salt) * values.length);
	return values[pickedIndex] ?? values[0];
}

export function buildPaginationDemoSeedItem(position: number) {
	const category = pickFrom(paginationDemoCategories, position, 7);
	const status = pickFrom(paginationDemoStatuses, position, 11);
	const prefix = pickFrom(paginationDemoPrefixes, position, 13);
	const title = pickFrom(paginationDemoTitles[category], position, 17);
	const titleNumber = 4100 + position;
	const updatedAt =
		Date.UTC(2026, 2, 10, 18, 0, 0) -
		position * 11 * 60 * 1000 -
		Math.floor(seeded(position, 19) * 8 * 60 * 1000);

	return paginationDemoSeedItemSchema.parse({
		position,
		title: `${prefix} ${title} #${titleNumber}`,
		category,
		status,
		summary: `Synthetic record ${titleNumber} for ${category} operations, staged in ${status} to exercise Convex cursor pagination at scale.`,
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
} as const;

export type PaginationDemoSeedItem = z.infer<typeof paginationDemoSeedItemSchema>;
export type PaginationDemoItem = z.infer<typeof paginationDemoListItemSchema>;
