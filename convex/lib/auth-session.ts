import { CRPCError } from "better-convex/server";

import type { Id } from "../src/_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../src/generated/server";

export type ValidatedAuth = {
	sessionId: Id<"session">;
	userId: string;
};

const AUTH_REQUIRED_ERROR = new CRPCError({
	code: "UNAUTHORIZED",
	message: "Authentication required",
});

const SESSION_INVALID_ERROR = new CRPCError({
	code: "UNAUTHORIZED",
	message: "Session invalid",
});

const getValidatedIdentity = async (
	ctx: Pick<QueryCtx, "auth"> | Pick<MutationCtx, "auth">,
): Promise<ValidatedAuth> => {
	const identity = await ctx.auth.getUserIdentity();

	if (
		!identity ||
		typeof identity.subject !== "string" ||
		typeof identity.sessionId !== "string"
	) {
		throw AUTH_REQUIRED_ERROR;
	}

	return {
		sessionId: identity.sessionId as Id<"session">,
		userId: identity.subject,
	};
};

const assertActiveSession = (session: unknown, userId: string) => {
	if (!session || typeof session !== "object") {
		throw SESSION_INVALID_ERROR;
	}

	const expiresAt = (session as { expiresAt?: unknown }).expiresAt;
	const sessionUserId = (session as { userId?: unknown }).userId;

	if (
		typeof expiresAt !== "number" ||
		expiresAt <= Date.now() ||
		typeof sessionUserId !== "string" ||
		sessionUserId !== userId
	) {
		throw SESSION_INVALID_ERROR;
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
