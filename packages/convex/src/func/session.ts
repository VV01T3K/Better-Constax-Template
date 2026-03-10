import { CRPCError } from "better-convex/server";

import { validateQueryOrMutationAuth } from "../../lib/auth-session";
import { c } from "../../lib/crpc";
import { authSchema } from "../../shared/schemas/auth";

export const me = c.query.output(authSchema.me.output).query(async ({ ctx }) => {
	try {
		const validated = await validateQueryOrMutationAuth(ctx);
		// oxlint-disable-next-line no-unsafe-type-assertion
		const user = await ctx.db.get(validated.userId);
		if (!user) {
			return null;
		}
		return {
			userId: validated.userId,
			name: user.name,
		};
	} catch (error) {
		if (error instanceof CRPCError && error.code === "UNAUTHORIZED") {
			return null;
		}

		throw error;
	}
});
