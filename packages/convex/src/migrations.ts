import { Migrations } from "@convex-dev/migrations";

import { paginationDemoSeedRows } from "../shared/schemas/pagination-demo";
import { components } from "./_generated/api.js";
import type { DataModel } from "./_generated/dataModel.js";
import { internalMutation } from "./_generated/server.js";

// Define migration functions in this file, then run them via `migrations:run`.
export const migrations = new Migrations<DataModel>(components.migrations);
export const run = migrations.runner();

export const seedPaginationDemoItems = internalMutation({
	args: {},
	handler: async ({ db }) => {
		const existingRows = await db.query("paginationDemoItems").collect();
		const existingPositions = new Set(existingRows.map((row) => row.position));
		let inserted = 0;

		for (const row of paginationDemoSeedRows) {
			if (existingPositions.has(row.position)) {
				continue;
			}

			await db.insert("paginationDemoItems", row);
			inserted += 1;
		}

		return {
			inserted,
			skipped: inserted === 0,
		};
	},
});
