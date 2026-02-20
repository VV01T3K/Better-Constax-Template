import { z } from "zod";

export const appRoles = ["user", "manager", "admin"] as const;
export const appRoleSchema = z.enum(appRoles);
export type AppRole = z.infer<typeof appRoleSchema>;

export const appPermissions = [
	"demo.todos.manage",
	"demo.files.manage",
	"demo.address-form.manage",
	"demo.table.view",
	"demo.massive-data.view",
	"admin.users.view",
	"admin.users.roles.edit",
	"admin.users.impersonate",
	"admin.permissions.view",
	"admin.permissions.edit",
] as const;
export const appPermissionSchema = z.enum(appPermissions);
export type AppPermission = z.infer<typeof appPermissionSchema>;

type PermissionMeta = {
	label: string;
	description: string;
	group: "Demos" | "Admin";
};

export const appPermissionCatalog: Record<AppPermission, PermissionMeta> = {
	"demo.todos.manage": {
		label: "Todos Demo",
		description: "Access and modify todos demos.",
		group: "Demos",
	},
	"demo.files.manage": {
		label: "File Upload Demo",
		description: "Upload, list, and delete demo files.",
		group: "Demos",
	},
	"demo.address-form.manage": {
		label: "Address Form Demo",
		description: "Submit and view address form entries.",
		group: "Demos",
	},
	"demo.table.view": {
		label: "Table Demo",
		description: "View table demo data.",
		group: "Demos",
	},
	"demo.massive-data.view": {
		label: "Massive Data Demo",
		description: "Access the massive dataset demo.",
		group: "Demos",
	},
	"admin.users.view": {
		label: "Admin Users Page",
		description: "View the admin user management page.",
		group: "Admin",
	},
	"admin.users.roles.edit": {
		label: "Edit User Roles",
		description: "Change roles for users in admin users page.",
		group: "Admin",
	},
	"admin.users.impersonate": {
		label: "Impersonate Users",
		description: "Start user impersonation sessions from admin users page.",
		group: "Admin",
	},
	"admin.permissions.view": {
		label: "Admin Permissions Page",
		description: "View role-permission matrix page.",
		group: "Admin",
	},
	"admin.permissions.edit": {
		label: "Edit Permissions Matrix",
		description: "Update role-permission assignments.",
		group: "Admin",
	},
};

export const defaultRolePermissionMatrix: Record<AppRole, readonly AppPermission[]> = {
	user: ["demo.todos.manage", "demo.massive-data.view"],
	manager: [
		"demo.todos.manage",
		"demo.files.manage",
		"demo.address-form.manage",
		"demo.table.view",
		"demo.massive-data.view",
	],
	admin: appPermissions,
};

export function normalizeRole(value: unknown): AppRole {
	if (typeof value !== "string") {
		return "user";
	}

	const role = value.split(",")[0]?.trim().toLowerCase();
	if (!role) {
		return "user";
	}

	return appRoles.find((allowedRole) => allowedRole === role) ?? "user";
}

export function isAppRole(value: unknown): value is AppRole {
	return typeof value === "string" && appRoles.some((role) => role === value);
}

export function isAppPermission(value: unknown): value is AppPermission {
	return typeof value === "string" && appPermissions.some((permission) => permission === value);
}

export function normalizePermissionList(permissions: readonly unknown[]): AppPermission[] {
	return [...new Set(permissions.filter(isAppPermission))];
}

export const rolePermissionSchema = z.object({
	role: appRoleSchema,
	permissions: z.array(appPermissionSchema),
	updatedAt: z.number(),
});

export const impersonationAuditSchema = z.object({
	actorUserId: z.string(),
	targetUserId: z.string(),
	startedAt: z.number(),
	endedAt: z.union([z.number(), z.null()]),
	source: z.union([z.string(), z.null()]),
	reason: z.union([z.string(), z.null()]),
});

export const routePermissionMap = {
	"/demo/convex-query": "demo.todos.manage",
	"/demo/tanstack-optimistic": "demo.todos.manage",
	"/demo/file-upload": "demo.files.manage",
	"/demo/form/address": "demo.address-form.manage",
	"/demo/table": "demo.table.view",
	"/demo/massive-data": "demo.massive-data.view",
	"/admin/users": "admin.users.view",
	"/admin/permissions": "admin.permissions.view",
} as const;
