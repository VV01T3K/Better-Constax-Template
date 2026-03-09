import { Migrations } from "@convex-dev/migrations";

import { tanstackTableDemoSeedRows } from "../shared/schemas/tanstack-table-demo";
import { components } from "./_generated/api.js";
import type { DataModel } from "./_generated/dataModel.js";
import { internalMutation } from "./_generated/server.js";

// Define migration functions in this file, then run them via `migrations:run`.
export const migrations = new Migrations<DataModel>(components.migrations);
export const run = migrations.runner();

export const seedTanstackTableDemoRows = internalMutation({
	args: {},
	handler: async ({ db }) => {
		const existingRows = await db.query("tanstackTableDemoRows").collect();
		const existingCaseIds = new Set(existingRows.map((row) => row.caseId));
		let inserted = 0;

		for (const row of tanstackTableDemoSeedRows) {
			if (existingCaseIds.has(row.caseId)) {
				continue;
			}

			await db.insert("tanstackTableDemoRows", row);
			inserted += 1;
		}

		return {
			inserted,
			skipped: inserted === 0,
		};
	},
});
