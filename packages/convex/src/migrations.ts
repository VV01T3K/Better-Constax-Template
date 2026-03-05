import { Migrations } from "@convex-dev/migrations";

import { components } from "./_generated/api.js";
import type { DataModel } from "./_generated/dataModel.js";

// Define migration functions in this file, then run them via `migrations:run`.
export const migrations = new Migrations<DataModel>(components.migrations);
export const run = migrations.runner();
