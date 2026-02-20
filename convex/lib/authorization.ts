import type { UserIdentity } from "convex/server";

import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { AppPermission, AppRole, PermissionScope } from "../schemas";
import {
	appPermissionCatalog,
	appPermissions,
	appRoles,
	defaultRolePermissionMatrix,
	permissionScopes,
	normalizePermissionList,
	normalizeRole,
} from "../schemas";

type ContextWithDb = Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">;

export type RolePermissionMatrix = Record<AppRole, AppPermission[]>;

const permissionScopeMap = new Map<AppPermission, PermissionScope>(
	appPermissions.map((permission) => [permission, appPermissionCatalog[permission].scope]),
);

const defaultCatalog = appPermissions.map((permission) => ({
	key: permission,
	label: appPermissionCatalog[permission].label,
	description: appPermissionCatalog[permission].description,
	group: appPermissionCatalog[permission].group,
	action: appPermissionCatalog[permission].action,
	scope: appPermissionCatalog[permission].scope,
}));

export function getPermissionCatalog(scope?: PermissionScope) {
	if (!scope) {
		return defaultCatalog;
	}

	return defaultCatalog.filter((permission) => permission.scope === scope);
}

export function getPermissionsForScope(scope: PermissionScope): AppPermission[] {
	return appPermissions.filter((permission) => permissionScopeMap.get(permission) === scope);
}

export function splitPermissionsByScope(permissions: readonly AppPermission[]): {
	app: AppPermission[];
	admin: AppPermission[];
} {
	const result = {
		app: [] as AppPermission[],
		admin: [] as AppPermission[],
	};

	for (const permission of permissions) {
		const scope = permissionScopeMap.get(permission);
		if (scope) {
			result[scope].push(permission);
		}
	}

	return result;
}

export function keepScopePermissions(
	permissions: readonly AppPermission[],
	scope: PermissionScope,
): AppPermission[] {
	return permissions.filter((permission) => permissionScopeMap.get(permission) === scope);
}

export function dropScopePermissions(
	permissions: readonly AppPermission[],
	scope: PermissionScope,
): AppPermission[] {
	return permissions.filter((permission) => permissionScopeMap.get(permission) !== scope);
}

export function getPermissionScope(permission: AppPermission): PermissionScope {
	return permissionScopeMap.get(permission) ?? "app";
}

export function isPermissionScope(value: unknown): value is PermissionScope {
	return typeof value === "string" && permissionScopes.some((scope) => scope === value);
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
