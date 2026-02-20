import { NoOp, customCtx } from "convex-helpers/server/customFunctions";
import { zCustomMutation, zCustomQuery } from "convex-helpers/server/zod4";
import type { UserIdentity } from "convex/server";
import { ConvexError } from "convex/values";

import type { Doc, Id, TableNames } from "../_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "../_generated/server";

export const zQuery = zCustomQuery(query, NoOp);
export const zMutation = zCustomMutation(mutation, NoOp);

type ContextWithAuth = Pick<QueryCtx, "auth"> | Pick<MutationCtx, "auth">;
type ContextWithDb = Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">;
type ContextWithIdentity = { identity: UserIdentity };
type MaybePromise<T> = T | Promise<T>;

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

export async function requireAuth(
	ctx: ContextWithAuth,
	options?: { message?: string },
): Promise<UserIdentity> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throwUnauthorized(options?.message);
	}
	return identity;
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

export async function getOwnedDocOrThrow<
	TableName extends TableNames,
	OwnerField extends Extract<keyof Doc<TableName>, string>,
>(
	ctx: ContextWithDb,
	id: Id<TableName>,
	options: {
		ownerId: string;
		ownerField?: OwnerField;
		notFoundMessage?: string;
		forbiddenMessage?: string;
	},
): Promise<Doc<TableName>> {
	const document = await ctx.db.get(id);
	if (!document) {
		throwNotFound(options.notFoundMessage);
	}

	if (options.ownerField) {
		if (document[options.ownerField] !== options.ownerId) {
			throwForbidden(options.forbiddenMessage);
		}
		return document;
	}

	if (!("authUserId" in document) || document.authUserId !== options.ownerId) {
		throwForbidden(options.forbiddenMessage);
	}

	return document;
}
