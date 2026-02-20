import type { UserIdentity } from "convex/server";

import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { AppPermission, AppRole } from "../schemas";
import {
	appPermissionCatalog,
	appPermissions,
	appRoles,
	defaultRolePermissionMatrix,
	normalizePermissionList,
	normalizeRole,
} from "../schemas";

type ContextWithDb = Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">;

export type RolePermissionMatrix = Record<AppRole, AppPermission[]>;

const defaultCatalog = appPermissions.map((permission) => ({
	key: permission,
	label: appPermissionCatalog[permission].label,
	description: appPermissionCatalog[permission].description,
	group: appPermissionCatalog[permission].group,
}));

export function getPermissionCatalog() {
	return defaultCatalog;
}

function buildDefaultMatrix(): RolePermissionMatrix {
	return {
		user: [...defaultRolePermissionMatrix.user],
		manager: [...defaultRolePermissionMatrix.manager],
		admin: [...appPermissions],
	};
}

export async function getRolePermissionMatrix(ctx: ContextWithDb): Promise<RolePermissionMatrix> {
	const matrix = buildDefaultMatrix();
	const rows = await ctx.db.query("rolePermissions").collect();

	for (const role of appRoles) {
		const row = rows.find((item) => item.role === role);
		if (!row) {
			continue;
		}
		matrix[role] = normalizePermissionList(row.permissions);
	}

	// Admin always retains full access for lockout safety.
	matrix.admin = [...appPermissions];
	return matrix;
}

export function getRoleFromIdentity(identity: UserIdentity): AppRole {
	return normalizeRole((identity as UserIdentity & { role?: unknown }).role);
}

export async function getRoleAndPermissions(
	ctx: ContextWithDb,
	identity: UserIdentity,
): Promise<{ role: AppRole; permissions: AppPermission[] }> {
	const role = getRoleFromIdentity(identity);
	const matrix = await getRolePermissionMatrix(ctx);
	return {
		role,
		permissions: matrix[role],
	};
}

export async function hasPermission(
	ctx: ContextWithDb,
	identity: UserIdentity,
	permission: AppPermission,
): Promise<boolean> {
	const { permissions } = await getRoleAndPermissions(ctx, identity);
	return permissions.includes(permission);
}
