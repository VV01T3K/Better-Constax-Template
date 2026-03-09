import { withSystemFields } from "better-convex/server";
import * as z from "zod";

export const tanstackTableDemoStatusValues = ["queued", "review", "blocked", "ready"] as const;
export const tanstackTableDemoPriorityValues = ["low", "medium", "high", "urgent"] as const;
export const tanstackTableDemoRegionValues = ["us", "emea", "apac"] as const;
export const tanstackTableDemoSortKeyValues = [
	"caseId",
	"name",
	"owner",
	"status",
	"priority",
	"region",
	"amountCents",
	"updatedAt",
] as const;
export const tanstackTableDemoSortDirectionValues = ["asc", "desc"] as const;

export const tanstackTableDemoStatusSchema = z.enum(tanstackTableDemoStatusValues);
export const tanstackTableDemoPrioritySchema = z.enum(tanstackTableDemoPriorityValues);
export const tanstackTableDemoRegionSchema = z.enum(tanstackTableDemoRegionValues);
export const tanstackTableDemoSortKeySchema = z.enum(tanstackTableDemoSortKeyValues);
export const tanstackTableDemoSortDirectionSchema = z.enum(tanstackTableDemoSortDirectionValues);

export const tanstackTableDemoShape = {
	caseId: z.string().trim().min(1, "Case ID is required"),
	name: z.string().trim().min(1, "Case name is required"),
	owner: z.string().trim().min(1, "Owner is required"),
	status: tanstackTableDemoStatusSchema,
	priority: tanstackTableDemoPrioritySchema,
	region: tanstackTableDemoRegionSchema,
	amountCents: z.number().int().nonnegative(),
	updatedAt: z.number().int().nonnegative(),
};

export const tanstackTableDemoInsertSchema = z.object(tanstackTableDemoShape);
export const tanstackTableDemoDocSchema = z.object(
	withSystemFields("tanstackTableDemoRows", tanstackTableDemoShape),
);

export const tanstackTableDemoSchema = {
	page: {
		input: z.object({
			filter: z.string().default(""),
			pageIndex: z.number().int().nonnegative().default(0),
			pageSize: z.number().int().positive().max(50).default(10),
			sortDirection: tanstackTableDemoSortDirectionSchema.default("desc"),
			sortKey: tanstackTableDemoSortKeySchema.default("updatedAt"),
			status: z.union([tanstackTableDemoStatusSchema, z.literal("all")]).default("all"),
		}),
		output: z.object({
			filter: z.string(),
			pageCount: z.number().int().positive(),
			pageIndex: z.number().int().nonnegative(),
			pageSize: z.number().int().positive(),
			rows: z.array(tanstackTableDemoDocSchema),
			sortDirection: tanstackTableDemoSortDirectionSchema,
			sortKey: tanstackTableDemoSortKeySchema,
			status: z.union([tanstackTableDemoStatusSchema, z.literal("all")]),
			totalRows: z.number().int().nonnegative(),
		}),
	},
} as const;

const ownerValues = [
	"Avery Quinn",
	"Sofia Patel",
	"Mina Cho",
	"Jonah Reed",
	"Talia Brooks",
	"Leo Barnes",
	"Priya Singh",
	"Mateo Cruz",
	"Elena Park",
	"Marcus Hale",
] as const;

const companyValues = [
	"Northwind",
	"Helio",
	"Kepler",
	"Atlas",
	"Lumen",
	"Vector",
	"Aster",
	"Nimbus",
	"Orion",
	"Cinder",
	"Beacon",
	"Pioneer",
	"Summit",
	"Drift",
	"Meridian",
	"Harbor",
	"Sable",
	"Mosaic",
	"Signal",
	"Forge",
] as const;

const taskValues = [
	"quarterly filing",
	"cross-border payout audit",
	"merchant onboarding batch",
	"invoice remediation",
	"payroll reconciliation",
	"reseller tax packet",
	"deferred revenue check",
	"contractor payout review",
	"partner settlement sweep",
	"chargeback reserve update",
	"VAT registration prep",
	"treasury exception review",
	"entity nexus review",
	"subscription tax mapping",
	"withholding exception queue",
	"journal variance follow-up",
	"refund reserve review",
	"credit memo validation",
	"annual close readiness",
	"regional filing preview",
] as const;

const seeded = (index: number, salt: number) => {
	const value = (index * 9301 + salt * 49297 + 233280) % 233280;
	return value / 233280;
};

const pickFrom = <T>(values: readonly T[], index: number, salt: number): T => {
	const selectedIndex = Math.floor(seeded(index, salt) * values.length);
	return values[selectedIndex] ?? values[0];
};

const buildGeneratedSeedRow = (index: number) => {
	const caseNumber = 2413 + index;
	const company = pickFrom(companyValues, index, 3);
	const task = pickFrom(taskValues, index, 7);
	const owner = pickFrom(ownerValues, index, 11);
	const status = pickFrom(tanstackTableDemoStatusValues, index, 13);
	const priority = pickFrom(tanstackTableDemoPriorityValues, index, 17);
	const region = pickFrom(tanstackTableDemoRegionValues, index, 19);
	const amountCents = 35_000 + Math.floor(seeded(index, 23) * 575_000);
	const updatedAt =
		Date.UTC(2026, 2, 6, 10, 0, 0) -
		index * 47 * 60 * 1000 -
		Math.floor(seeded(index, 29) * 900_000);

	return {
		caseId: `CTX-${caseNumber}`,
		name: `${company} ${task}`,
		owner,
		status,
		priority,
		region,
		amountCents,
		updatedAt,
	};
};

const tanstackTableDemoBaseSeedRows = [
	{
		caseId: "CTX-2401",
		name: "Northwind quarterly filing",
		owner: "Avery Quinn",
		status: "review",
		priority: "urgent",
		region: "us",
		amountCents: 482000,
		updatedAt: Date.UTC(2026, 2, 8, 16, 35, 0),
	},
	{
		caseId: "CTX-2402",
		name: "Helio cross-border payout audit",
		owner: "Sofia Patel",
		status: "blocked",
		priority: "high",
		region: "emea",
		amountCents: 153500,
		updatedAt: Date.UTC(2026, 2, 8, 14, 10, 0),
	},
	{
		caseId: "CTX-2403",
		name: "Kepler merchant onboarding batch",
		owner: "Mina Cho",
		status: "queued",
		priority: "medium",
		region: "apac",
		amountCents: 96500,
		updatedAt: Date.UTC(2026, 2, 8, 12, 5, 0),
	},
	{
		caseId: "CTX-2404",
		name: "Atlas invoice remediation",
		owner: "Jonah Reed",
		status: "ready",
		priority: "high",
		region: "us",
		amountCents: 221000,
		updatedAt: Date.UTC(2026, 2, 7, 19, 20, 0),
	},
	{
		caseId: "CTX-2405",
		name: "Lumen payroll reconciliation",
		owner: "Talia Brooks",
		status: "review",
		priority: "medium",
		region: "emea",
		amountCents: 77400,
		updatedAt: Date.UTC(2026, 2, 7, 17, 42, 0),
	},
	{
		caseId: "CTX-2406",
		name: "Vector reseller tax packet",
		owner: "Leo Barnes",
		status: "queued",
		priority: "low",
		region: "us",
		amountCents: 41800,
		updatedAt: Date.UTC(2026, 2, 7, 15, 15, 0),
	},
	{
		caseId: "CTX-2407",
		name: "Aster deferred revenue check",
		owner: "Priya Singh",
		status: "blocked",
		priority: "urgent",
		region: "apac",
		amountCents: 301900,
		updatedAt: Date.UTC(2026, 2, 7, 13, 58, 0),
	},
	{
		caseId: "CTX-2408",
		name: "Nimbus contractor payout review",
		owner: "Avery Quinn",
		status: "ready",
		priority: "low",
		region: "emea",
		amountCents: 56400,
		updatedAt: Date.UTC(2026, 2, 7, 10, 27, 0),
	},
	{
		caseId: "CTX-2409",
		name: "Orion partner settlement sweep",
		owner: "Mina Cho",
		status: "review",
		priority: "high",
		region: "apac",
		amountCents: 128800,
		updatedAt: Date.UTC(2026, 2, 6, 21, 12, 0),
	},
	{
		caseId: "CTX-2410",
		name: "Cinder chargeback reserve update",
		owner: "Jonah Reed",
		status: "queued",
		priority: "medium",
		region: "us",
		amountCents: 112300,
		updatedAt: Date.UTC(2026, 2, 6, 18, 49, 0),
	},
	{
		caseId: "CTX-2411",
		name: "Beacon VAT registration prep",
		owner: "Sofia Patel",
		status: "ready",
		priority: "medium",
		region: "emea",
		amountCents: 68900,
		updatedAt: Date.UTC(2026, 2, 6, 15, 8, 0),
	},
	{
		caseId: "CTX-2412",
		name: "Pioneer treasury exception review",
		owner: "Talia Brooks",
		status: "blocked",
		priority: "high",
		region: "us",
		amountCents: 267500,
		updatedAt: Date.UTC(2026, 2, 6, 11, 31, 0),
	},
] satisfies Array<z.infer<typeof tanstackTableDemoInsertSchema>>;

const tanstackTableDemoGeneratedSeedRows = Array.from({ length: 132 }, (_, index) =>
	buildGeneratedSeedRow(index),
);

export const tanstackTableDemoSeedRows = [
	...tanstackTableDemoBaseSeedRows,
	...tanstackTableDemoGeneratedSeedRows,
] satisfies Array<z.infer<typeof tanstackTableDemoInsertSchema>>;

export type TanstackTableDemoStatus = z.infer<typeof tanstackTableDemoStatusSchema>;
export type TanstackTableDemoPriority = z.infer<typeof tanstackTableDemoPrioritySchema>;
export type TanstackTableDemoRegion = z.infer<typeof tanstackTableDemoRegionSchema>;
export type TanstackTableDemoSortKey = z.infer<typeof tanstackTableDemoSortKeySchema>;
export type TanstackTableDemoSortDirection = z.infer<typeof tanstackTableDemoSortDirectionSchema>;
export type TanstackTableDemoRow = z.infer<typeof tanstackTableDemoDocSchema>;
export type TanstackTableDemoPageInput = z.infer<typeof tanstackTableDemoSchema.page.input>;
export type TanstackTableDemoPage = z.infer<typeof tanstackTableDemoSchema.page.output>;
