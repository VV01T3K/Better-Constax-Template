import type { UserIdentity } from "convex/server";

import { normalizeRole, type AppRole } from "../schemas";

export function getRoleClaimValue(subject: unknown): unknown {
	if (!subject || typeof subject !== "object") {
		return undefined;
	}

	if (!("role" in subject)) {
		return undefined;
	}

	return subject.role;
}

export function getRoleFromIdentity(identity: UserIdentity): AppRole {
	return normalizeRole(getRoleClaimValue(identity));
}
