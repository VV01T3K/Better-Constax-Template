import { z } from "zod";

import type { MutationCtx } from "../_generated/server";
import {
	getPermissionCatalog,
	getRoleAndPermissions,
	getRolePermissionMatrix,
	hasPermission as checkPermission,
	type RolePermissionMatrix,
} from "../lib/authorization";
import {
	getAuthUserId,
	requirePermissionForIdentity,
	throwForbidden,
	zMutation,
	zQuery,
} from "../lib/functionHelpers";
import {
	appPermissionSchema,
	appPermissions,
	appRoles,
	isAppPermission,
	normalizePermissionList,
} from "../schemas";

const editableRoles = ["user", "manager"] as const;

const updateMatrixInputSchema = z.object({
	user: z.array(z.string()),
	manager: z.array(z.string()),
	admin: z.array(z.string()).optional(),
});

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

export const getCatalogAndMatrix = zQuery({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throwForbidden("Authentication required");
		}

		await requirePermissionForIdentity(ctx, identity, "admin.permissions.view");
		const matrix = await getRolePermissionMatrix(ctx);

		return {
			roles: appRoles,
			permissions: appPermissions,
			editableRoles,
			catalog: getPermissionCatalog(),
			matrix,
		};
	},
});

export const updateMatrix = zMutation({
	args: {
		matrix: updateMatrixInputSchema,
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throwForbidden("Authentication required");
		}

		await requirePermissionForIdentity(ctx, identity, "admin.permissions.edit");

		const candidatePermissions = [
			...args.matrix.user,
			...args.matrix.manager,
			...(args.matrix.admin ?? []),
		];
		const unknownPermissions = candidatePermissions.filter(
			(permission) => !isAppPermission(permission),
		);
		if (unknownPermissions.length > 0) {
			throwForbidden(`Unknown permission(s): ${unknownPermissions.join(", ")}`);
		}

		const nextMatrix: RolePermissionMatrix = {
			user: normalizePermissionList(args.matrix.user),
			manager: normalizePermissionList(args.matrix.manager),
			admin: [...appPermissions],
		};

		// Lockout protection: keep critical admin edit permission available to admin role.
		if (!nextMatrix.admin.includes("admin.permissions.edit")) {
			throwForbidden("Cannot remove admin permission editing capability");
		}

		await upsertRolePermissions(ctx, nextMatrix);

		return {
			roles: appRoles,
			permissions: appPermissions,
			editableRoles,
			catalog: getPermissionCatalog(),
			matrix: nextMatrix,
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
