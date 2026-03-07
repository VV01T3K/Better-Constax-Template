import { CRPCError } from "better-convex/server";

import type { Id } from "../src/_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../src/generated/server";

export type ValidatedAuth = {
	sessionId: Id<"session">;
	userId: Id<"user">;
};

const getValidatedIdentity = async (
	ctx: Pick<QueryCtx, "auth"> | Pick<MutationCtx, "auth">,
): Promise<ValidatedAuth> => {
	const identity = await ctx.auth.getUserIdentity();

	if (!identity || typeof identity.subject !== "string" || typeof identity.sessionId !== "string") {
		throw new CRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
		});
	}

	return {
		// oxlint-disable-next-line no-unsafe-type-assertion
		sessionId: identity.sessionId as Id<"session">,
		// oxlint-disable-next-line no-unsafe-type-assertion
		userId: identity.subject as Id<"user">,
	};
};

const assertActiveSession = (session: unknown, userId: Id<"user">) => {
	if (!session || typeof session !== "object") {
		throw new CRPCError({
			code: "UNAUTHORIZED",
			message: "Session invalid",
		});
	}

	const expiresAt = (session as { expiresAt?: unknown }).expiresAt;
	const sessionUserId = (session as { userId?: unknown }).userId;

	if (
		typeof expiresAt !== "number" ||
		expiresAt <= Date.now() ||
		typeof sessionUserId !== "string" ||
		sessionUserId !== userId
	) {
		throw new CRPCError({
			code: "UNAUTHORIZED",
			message: "Session invalid",
		});
	}
};

export const validateQueryOrMutationAuth = async (
	ctx: QueryCtx | MutationCtx,
): Promise<ValidatedAuth> => {
	const validated = await getValidatedIdentity(ctx);
	const session = await ctx.db.get(validated.sessionId);

	assertActiveSession(session, validated.userId);

	return validated;
};
