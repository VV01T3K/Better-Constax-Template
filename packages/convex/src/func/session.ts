import { CRPCError } from "better-convex/server";

import { validateQueryOrMutationAuth } from "../../lib/auth-session";
import { c } from "../../lib/crpc";
import { authStateSchema } from "../../shared/schemas/auth-state";
import type { Id } from "../_generated/dataModel";

export const me = c.query.output(authStateSchema.me.output).query(async ({ ctx }) => {
	try {
		const validated = await validateQueryOrMutationAuth(ctx);
		// oxlint-disable-next-line no-unsafe-type-assertion
		const user = await ctx.db.get(validated.userId as Id<"user">);
		return {
			userId: validated.userId,
			name: user?.name ?? "Unknown",
		};
	} catch (error) {
		if (error instanceof CRPCError && error.code === "UNAUTHORIZED") {
			return null;
		}

		throw error;
	}
});
