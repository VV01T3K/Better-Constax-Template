import { NoOp, customCtx } from "convex-helpers/server/customFunctions";
import { zCustomMutation, zCustomQuery } from "convex-helpers/server/zod4";
import type { UserIdentity } from "convex/server";
import { ConvexError } from "convex/values";
import { z } from "zod";

import { components } from "../_generated/api";
import type { Doc, Id, TableNames } from "../_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "../_generated/server";
import { parseAuthUserId, type AppPermission, type AuthUserId } from "../schemas";
import { hasPermission } from "./authorization";

export const zQuery = zCustomQuery(query, NoOp);
export const zMutation = zCustomMutation(mutation, NoOp);

type ContextWithAuthAndRunner =
	| Pick<QueryCtx, "auth" | "runQuery">
	| Pick<MutationCtx, "auth" | "runQuery">;
type ContextWithDb = Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">;
type ContextWithIdentity = { identity: UserIdentity };
type MaybePromise<T> = T | Promise<T>;
const betterAuthSessionSchema = z.object({
	userId: z.string().optional(),
	expiresAt: z.number().nullable().optional(),
});

export function throwUnauthorized(message = "Authentication required"): never {
	throw new ConvexError({
		code: "UNAUTHORIZED",
		message,
	});
}

export function throwForbidden(message = "You do not have access to this resource"): never {
	throw new ConvexError({
		code: "FORBIDDEN",
		message,
	});
}

export function throwNotFound(message = "Resource not found"): never {
	throw new ConvexError({
		code: "NOT_FOUND",
		message,
	});
}

function getSessionIdClaim(identity: UserIdentity): string | null {
	const sessionId = identity.sessionId;
	if (typeof sessionId !== "string" || sessionId.length === 0) {
		return null;
	}
	return sessionId;
}

async function hasActiveSession(
	ctx: ContextWithAuthAndRunner,
	identity: UserIdentity,
): Promise<boolean> {
	const sessionId = getSessionIdClaim(identity);
	if (!sessionId) {
		return false;
	}

	const session = await ctx.runQuery(components.betterAuth.adapter.findOne, {
		model: "session",
		where: [{ field: "_id", operator: "eq", value: sessionId }],
	});
	if (!session || typeof session !== "object") {
		return false;
	}

	const parsedSession = betterAuthSessionSchema.safeParse(session);
	if (!parsedSession.success) {
		return false;
	}
	const sessionRecord = parsedSession.data;
	if (typeof sessionRecord.userId !== "string" || sessionRecord.userId !== identity.subject) {
		return false;
	}

	return (
		typeof sessionRecord.expiresAt !== "number" ||
		Number.isNaN(sessionRecord.expiresAt) ||
		sessionRecord.expiresAt > Date.now()
	);
}

export async function getValidatedIdentity(ctx: ContextWithAuthAndRunner): Promise<UserIdentity | null> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		return null;
	}

	return (await hasActiveSession(ctx, identity)) ? identity : null;
}

export async function requireAuth(
	ctx: ContextWithAuthAndRunner,
	options?: { message?: string },
): Promise<UserIdentity> {
	const identity = await getValidatedIdentity(ctx);
	if (!identity) {
		throwUnauthorized(options?.message);
	}
	return identity;
}

export function getAuthUserId(identity: UserIdentity): AuthUserId {
	const parsedUserId = parseAuthUserId(identity.subject);
	if (parsedUserId.isErr()) {
		throwUnauthorized("Invalid authenticated user identifier");
	}

	return parsedUserId.value;
}

export const authedQuery = zCustomQuery(
	query,
	customCtx(async (ctx: QueryCtx) => ({
		identity: await requireAuth(ctx),
	})),
);

export const authedMutation = zCustomMutation(
	mutation,
	customCtx(async (ctx: MutationCtx) => ({
		identity: await requireAuth(ctx),
	})),
);

export async function requirePermissionForIdentity(
	ctx: ContextWithDb,
	identity: UserIdentity,
	permission: AppPermission,
	options?: { message?: string },
): Promise<void> {
	const allowed = await hasPermission(ctx, identity, permission);
	if (!allowed) {
		throwForbidden(options?.message ?? "You do not have permission to perform this action");
	}
}

export function withIdentity<TContext extends ContextWithIdentity, TArgs, TResult>(
	handler: (
		ctx: Omit<TContext, "identity">,
		args: TArgs,
		identity: UserIdentity,
	) => MaybePromise<TResult>,
) {
	return async (ctx: TContext, args: TArgs) => {
		return await handler(ctx, args, ctx.identity);
	};
}

export async function getOwnedDocOrThrow<TableName extends TableNames>(
	ctx: ContextWithDb,
	id: Id<TableName>,
	options: {
		ownerId: AuthUserId;
		ownerField?: string;
		notFoundMessage?: string;
		forbiddenMessage?: string;
	},
): Promise<Doc<TableName>> {
	const document = await ctx.db.get(id);
	if (!document) {
		throwNotFound(options.notFoundMessage);
	}

	if ("ownerField" in options && options.ownerField) {
		if (document[options.ownerField] !== options.ownerId) {
			throwForbidden(options.forbiddenMessage);
		}
		return document;
	}

	if (
		!("authUserId" in document && typeof document.authUserId === "string") ||
		document.authUserId !== options.ownerId
	) {
		throwForbidden(options.forbiddenMessage);
	}

	return document;
}
