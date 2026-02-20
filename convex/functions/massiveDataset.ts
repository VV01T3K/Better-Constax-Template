import { z } from "zod";

import { zQuery } from "../lib/functionHelpers";

const TOTAL_ROWS = 1_000_000;
const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

const regions = ["NA", "EU", "APAC", "LATAM", "MEA"] as const;
const statuses = ["active", "idle", "paused", "error"] as const;

function seeded(index: number, salt: number) {
	// Deterministic pseudo-random value in [0, 1)
	const value = (index * 9301 + salt * 49297 + 233280) % 233280;
	return value / 233280;
}

function pickFrom<T>(values: readonly T[], index: number, salt: number): T {
	const offset = Math.floor(seeded(index, salt) * values.length);
	return values[offset] ?? values[0];
}

function buildRow(index: number) {
	const score = Math.floor(seeded(index, 11) * 10_000);
	const throughput = Math.floor(seeded(index, 17) * 2_000);
	const latencyMs = 20 + Math.floor(seeded(index, 29) * 480);

	return {
		id: index,
		name: `Record-${String(index).padStart(7, "0")}`,
		region: pickFrom(regions, index, 5),
		status: pickFrom(statuses, index, 7),
		score,
		throughput,
		latencyMs,
		updatedAt: 1_700_000_000_000 + index * 30_000,
	};
}

export const page = zQuery({
	args: {
		cursor: z.union([z.number().int().nonnegative(), z.null()]),
		limit: z.number().int().positive().optional(),
	},
	handler: async (_ctx, { cursor, limit }) => {
		const safeLimit = Math.min(Math.max(limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
		const start = cursor ?? 0;

		if (start >= TOTAL_ROWS) {
			return {
				rows: [],
				nextCursor: null,
				totalRows: TOTAL_ROWS,
				hasMore: false,
				limit: safeLimit,
			};
		}

		const end = Math.min(start + safeLimit, TOTAL_ROWS);
		const rows = [];
		for (let index = start; index < end; index++) {
			rows.push(buildRow(index));
		}

		return {
			rows,
			nextCursor: end < TOTAL_ROWS ? end : null,
			totalRows: TOTAL_ROWS,
			hasMore: end < TOTAL_ROWS,
			limit: safeLimit,
		};
	},
});
