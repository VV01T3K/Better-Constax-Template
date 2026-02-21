import { z } from "zod";

import type { MutationCtx } from "../_generated/server";
import {
	dropScopePermissions,
	getPermissionCatalog,
	getPermissionsForScope,
	keepScopePermissions,
	getRoleAndPermissions,
	getRolePermissionMatrix,
	hasPermission as checkPermission,
	type RolePermissionMatrix,
} from "../lib/authorization";
import { getAuthUserId, throwForbidden, zQuery } from "../lib/functionHelpers";
import { guardedMutation, guardedQuery } from "../lib/guard-kit";
import {
	appPermissionSchema,
	appPermissions,
	permissionScopeSchema,
	appRoles,
	isAppPermission,
	normalizePermissionList,
	type PermissionScope,
} from "../schemas";

const editableRoles = ["user", "manager"] as const;

const updateMatrixInputSchema = z.object({
	user: z.array(z.string()),
	manager: z.array(z.string()),
	admin: z.array(z.string()).optional(),
});

function getScopeViewPermission(scope: PermissionScope) {
	return scope === "app" ? "admin.permissions.app.access" : "admin.permissions.admin.access";
}

function getScopeEditPermission(scope: PermissionScope) {
	return scope === "app" ? "admin.permissions.app.mutate" : "admin.permissions.admin.mutate";
}

function getScopedMatrix(
	matrix: RolePermissionMatrix,
	scope: PermissionScope,
): RolePermissionMatrix {
	return {
		user: keepScopePermissions(matrix.user, scope),
		manager: keepScopePermissions(matrix.manager, scope),
		admin: keepScopePermissions(matrix.admin, scope),
	};
}

async function upsertRolePermissions(ctx: Pick<MutationCtx, "db">, matrix: RolePermissionMatrix) {
	const updatedAt = Date.now();

	for (const role of appRoles) {
		const existing = await ctx.db
			.query("rolePermissions")
			.withIndex("by_role", (q) => q.eq("role", role))
			.unique();

		if (existing) {
			await ctx.db.patch(existing._id, {
				permissions: matrix[role],
				updatedAt,
			});
			continue;
		}

		await ctx.db.insert("rolePermissions", {
			role,
			permissions: matrix[role],
			updatedAt,
		});
	}
}

export const getCatalogAndMatrix = guardedQuery({
	args: {
		scope: permissionScopeSchema,
	},
	access: ({ args }) => ({
		type: "allPermissions",
		permissions: [getScopeViewPermission(args.scope)],
	}),
	handler: async (ctx, args) => {
		const fullMatrix = await getRolePermissionMatrix(ctx);
		const scopedPermissions = getPermissionsForScope(args.scope);
		const matrix = getScopedMatrix(fullMatrix, args.scope);

		return {
			scope: args.scope,
			roles: appRoles,
			permissions: scopedPermissions,
			editableRoles,
			catalog: getPermissionCatalog(args.scope),
			matrix,
		};
	},
});

export const updateMatrix = guardedMutation({
	args: {
		scope: permissionScopeSchema,
		matrix: updateMatrixInputSchema,
	},
	access: ({ args }) => ({
		type: "allPermissions",
		permissions: [getScopeEditPermission(args.scope)],
	}),
	handler: async (ctx, args) => {
		const candidatePermissions = [
			...args.matrix.user,
			...args.matrix.manager,
			...(args.matrix.admin ?? []),
		];
		const scopedPermissionSet = new Set(getPermissionsForScope(args.scope));
		const unknownPermissions = candidatePermissions.filter(
			(permission) => !isAppPermission(permission) || !scopedPermissionSet.has(permission),
		);
		if (unknownPermissions.length > 0) {
			throwForbidden(`Unknown permission(s): ${unknownPermissions.join(", ")}`);
		}

		const nextScopedMatrix: RolePermissionMatrix = {
			user: normalizePermissionList(args.matrix.user),
			manager: normalizePermissionList(args.matrix.manager),
			admin: [...scopedPermissionSet],
		};

		const currentMatrix = await getRolePermissionMatrix(ctx);
		const nextMatrix: RolePermissionMatrix = {
			user: normalizePermissionList([
				...dropScopePermissions(currentMatrix.user, args.scope),
				...nextScopedMatrix.user,
			]),
			manager: normalizePermissionList([
				...dropScopePermissions(currentMatrix.manager, args.scope),
				...nextScopedMatrix.manager,
			]),
			admin: [...appPermissions],
		};

		// Lockout protection: keep critical admin edit permission available to admin role.
		if (!nextMatrix.admin.includes("admin.permissions.admin.mutate")) {
			throwForbidden("Cannot remove admin permission editing capability");
		}

		await upsertRolePermissions(ctx, nextMatrix);
		const scopedPermissions = getPermissionsForScope(args.scope);

		return {
			scope: args.scope,
			roles: appRoles,
			permissions: scopedPermissions,
			editableRoles,
			catalog: getPermissionCatalog(args.scope),
			matrix: getScopedMatrix(nextMatrix, args.scope),
		};
	},
});

export const getMyAccess = zQuery({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}

		const { role, permissions } = await getRoleAndPermissions(ctx, identity);
		return {
			userId: getAuthUserId(identity),
			role,
			permissions,
		};
	},
});

export const hasPermission = zQuery({
	args: {
		permission: appPermissionSchema,
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return false;
		}

		return await checkPermission(ctx, identity, args.permission);
	},
});
