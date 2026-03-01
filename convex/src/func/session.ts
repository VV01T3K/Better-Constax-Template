import { CRPCError } from "better-convex/server";

import { validateQueryOrMutationAuth } from "../../lib/auth-session";
import { c } from "../../lib/crpc";
import { authStateSchema } from "../../shared/schemas/auth-state";

export const me = c.query.output(authStateSchema.me.output).query(async ({ ctx }) => {
	try {
		const validated = await validateQueryOrMutationAuth(ctx);
		return {
			userId: validated.userId,
		};
	} catch (error) {
		if (error instanceof CRPCError && error.code === "UNAUTHORIZED") {
			return null;
		}

		throw error;
	}
});
