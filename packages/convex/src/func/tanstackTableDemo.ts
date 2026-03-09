import { c } from "../../lib/crpc";
import {
	type TanstackTableDemoPageInput,
	type TanstackTableDemoRow,
	tanstackTableDemoSchema,
} from "../../shared/schemas/tanstack-table-demo";

const compareValues = (left: string | number, right: string | number) => {
	if (typeof left === "number" && typeof right === "number") {
		return left - right;
	}

	return String(left).localeCompare(String(right));
};

const getSortableValue = (
	row: TanstackTableDemoRow,
	sortKey: TanstackTableDemoPageInput["sortKey"],
) => {
	return row[sortKey];
};

export const page = c.query
	.input(tanstackTableDemoSchema.page.input)
	.output(tanstackTableDemoSchema.page.output)
	.query(async ({ ctx, input }) => {
		const rows = await ctx.db.query("tanstackTableDemoRows").collect();
		const normalizedFilter = input.filter.trim().toLowerCase();

		const filteredRows = rows.filter((row) => {
			if (input.status !== "all" && row.status !== input.status) {
				return false;
			}

			if (normalizedFilter.length === 0) {
				return true;
			}

			return [
				row.caseId,
				row.name,
				row.owner,
				row.status,
				row.priority,
				row.region,
				String(row.amountCents),
			]
				.join(" ")
				.toLowerCase()
				.includes(normalizedFilter);
		});

		const direction = input.sortDirection === "asc" ? 1 : -1;
		const sortedRows = filteredRows.toSorted((left, right) => {
			const compared =
				compareValues(
					getSortableValue(left, input.sortKey),
					getSortableValue(right, input.sortKey),
				) * direction;

			if (compared !== 0) {
				return compared;
			}

			return left.caseId.localeCompare(right.caseId);
		});

		const totalRows = sortedRows.length;
		const pageCount = Math.max(1, Math.ceil(totalRows / input.pageSize));
		const pageIndex = Math.min(input.pageIndex, pageCount - 1);
		const start = pageIndex * input.pageSize;

		return {
			filter: input.filter,
			pageCount,
			pageIndex,
			pageSize: input.pageSize,
			rows: sortedRows.slice(start, start + input.pageSize),
			sortDirection: input.sortDirection,
			sortKey: input.sortKey,
			status: input.status,
			totalRows,
		};
	});
