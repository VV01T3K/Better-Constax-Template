import { NoOp } from "convex-helpers/server/customFunctions";
import { zCustomMutation, zCustomQuery } from "convex-helpers/server/zod4";
import { ConvexError } from "convex/values";

import { mutation, query } from "../_generated/server";

export const zQuery = zCustomQuery(query, NoOp);
export const zMutation = zCustomMutation(mutation, NoOp);

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

export async function requirePermission(_permission: string): Promise<void> {
	return;
}
