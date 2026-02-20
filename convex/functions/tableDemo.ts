import { z } from "zod";

import { zQuery } from "../lib/functionHelpers";

const TOTAL_ROWS = 5_000;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

const firstNames = [
	"Ava",
	"Liam",
	"Noah",
	"Emma",
	"Olivia",
	"Mason",
	"Sophia",
	"Lucas",
	"Isabella",
	"Elijah",
] as const;

const lastNames = [
	"Smith",
	"Johnson",
	"Williams",
	"Brown",
	"Jones",
	"Miller",
	"Davis",
	"Garcia",
	"Wilson",
	"Moore",
] as const;

type SortKey =
	| "id"
	| "firstName"
	| "lastName"
	| "fullName"
	| "age"
	| "visits"
	| "progress"
	| "status";
type SortDirection = "asc" | "desc";

function seeded(index: number, salt: number) {
	const value = (index * 9301 + salt * 49297 + 233280) % 233280;
	return value / 233280;
}

function pickFrom<T>(values: readonly T[], index: number, salt: number): T {
	const offset = Math.floor(seeded(index, salt) * values.length);
	return values[offset] ?? values[0];
}

function buildRow(id: number) {
	const firstName = pickFrom(firstNames, id, 3);
	const lastName = pickFrom(lastNames, id, 7);
	return {
		id,
		firstName,
		lastName,
		fullName: `${firstName} ${lastName}`,
		age: 18 + Math.floor(seeded(id, 11) * 63),
		visits: Math.floor(seeded(id, 17) * 1_000),
		progress: Math.floor(seeded(id, 29) * 100),
		status: pickFrom(["single", "relationship", "complicated"] as const, id, 5),
	};
}

const allRows = Array.from({ length: TOTAL_ROWS }, (_, id) => buildRow(id));

function compareValues(a: string | number, b: string | number) {
	if (typeof a === "number" && typeof b === "number") {
		return a - b;
	}
	return String(a).localeCompare(String(b));
}

function getSortableValue(row: ReturnType<typeof buildRow>, sortKey: SortKey): string | number {
	if (sortKey === "id") return row.id;
	if (sortKey === "firstName") return row.firstName;
	if (sortKey === "lastName") return row.lastName;
	if (sortKey === "fullName") return row.fullName;
	if (sortKey === "age") return row.age;
	if (sortKey === "visits") return row.visits;
	if (sortKey === "progress") return row.progress;
	return row.status;
}

export const page = zQuery({
	args: {
		filter: z.string().optional(),
		sortKey: z
			.enum(["id", "firstName", "lastName", "fullName", "age", "visits", "progress", "status"])
			.optional(),
		sortDirection: z.enum(["asc", "desc"]).optional(),
		pageIndex: z.number().int().nonnegative().optional(),
		pageSize: z.number().int().positive().optional(),
	},
	handler: async (_ctx, args) => {
		const sortKey: SortKey = args.sortKey ?? "id";
		const sortDirection: SortDirection = args.sortDirection ?? "asc";
		const pageIndex = args.pageIndex ?? 0;
		const pageSize = Math.min(args.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
		const normalizedFilter = (args.filter ?? "").trim().toLowerCase();

		const filteredRows =
			normalizedFilter.length === 0
				? allRows
				: allRows.filter((row) =>
						[
							String(row.id),
							row.firstName,
							row.lastName,
							row.fullName,
							String(row.age),
							String(row.visits),
							String(row.progress),
							row.status,
						]
							.join(" ")
							.toLowerCase()
							.includes(normalizedFilter),
					);

		const sortedRows = [...filteredRows];
		// oxlint-disable-next-line unicorn/no-array-sort
		sortedRows.sort((left, right) => {
			const direction = sortDirection === "asc" ? 1 : -1;
			return (
				compareValues(getSortableValue(left, sortKey), getSortableValue(right, sortKey)) * direction
			);
		});

		const totalRows = sortedRows.length;
		const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
		const clampedPageIndex = Math.min(pageIndex, pageCount - 1);
		const start = clampedPageIndex * pageSize;
		const rows = sortedRows.slice(start, start + pageSize);

		return {
			rows,
			totalRows,
			pageCount,
			pageIndex: clampedPageIndex,
			pageSize,
			sortKey,
			sortDirection,
			filter: args.filter ?? "",
		};
	},
});
