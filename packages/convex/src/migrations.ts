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
		let inserted = 0;
		let updated = 0;
		const existingByPosition = new Map(existingRows.map((row) => [row.position, row] as const));

		for (const row of paginationDemoSeedRows) {
			const existingRow = existingByPosition.get(row.position);
			if (existingRow) {
				await db.replace("paginationDemoItems", existingRow._id, row);
				updated += 1;
				continue;
			}

			await db.insert("paginationDemoItems", row);
			inserted += 1;
		}

		return {
			inserted,
			skipped: inserted === 0 && updated === 0,
			updated,
		};
	},
});
