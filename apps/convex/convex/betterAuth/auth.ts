// This file exists solely for the Better Auth CLI schema generation.
// It creates a static auth instance that the CLI can inspect.
import type { GenericCtx } from "@convex-dev/better-auth";

import type { DataModel } from "../_generated/dataModel";
import { createAuth } from "../auth";

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const emptyCtx = {} as GenericCtx<DataModel>;

export const auth = createAuth(emptyCtx);
