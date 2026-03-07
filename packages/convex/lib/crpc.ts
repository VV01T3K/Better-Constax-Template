import { CRPCError } from "better-convex/server";

import type { Doc, TableNames } from "../src/_generated/dataModel";
import { initCRPC } from "../src/generated/server";
import type { ValidatedAuth } from "./auth-session";
import { validateQueryOrMutationAuth } from "./auth-session";

export const c = initCRPC.create();

export const authMiddleware = c.middleware<object, ValidatedAuth>(async ({ ctx, next }) => {
	const validated = await validateQueryOrMutationAuth(
		// oxlint-disable-next-line no-unsafe-type-assertion
		ctx as Parameters<typeof validateQueryOrMutationAuth>[0],
	);

	return next({
		ctx: {
			...ctx,
			sessionId: validated.sessionId,
			userId: validated.userId,
		},
	});
});

export const assertOwnership = async <
	T extends { [K in TableNames]: Doc<K> extends { userId: string } ? K : never }[TableNames],
>(
	ctx: { db: { get: (id: Doc<T>["_id"]) => Promise<Doc<T> | null> }; userId: string },
	table: T,
	id: Doc<T>["_id"],
): Promise<Doc<T>> => {
	const doc = await ctx.db.get(id);

	if (!doc) {
		throw new CRPCError({ code: "NOT_FOUND", message: `${table} not found` });
	}

	if ((doc as Doc<T> & { userId: string }).userId !== ctx.userId) {
		throw new CRPCError({ code: "FORBIDDEN", message: `Not your ${table}` });
	}

	return doc;
};
