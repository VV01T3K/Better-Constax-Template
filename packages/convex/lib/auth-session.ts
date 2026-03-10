import { CRPCError } from "better-convex/server";

import type { Id } from "../src/_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../src/generated/server";

export type ValidatedAuth = {
	sessionId: Id<"session">;
	userId: Id<"user">;
};

const getValidatedIdentity = async (
	ctx: Pick<QueryCtx, "auth" | "db"> | Pick<MutationCtx, "auth" | "db">,
): Promise<ValidatedAuth> => {
	const identity = await ctx.auth.getUserIdentity();

	if (!identity || typeof identity.subject !== "string" || typeof identity.sessionId !== "string") {
		throw new CRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
		});
	}

	const sessionId = ctx.db.normalizeId("session", identity.sessionId);
	const userId = ctx.db.normalizeId("user", identity.subject);

	if (!sessionId || !userId) {
		throw new CRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
		});
	}

	return {
		sessionId,
		userId,
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
