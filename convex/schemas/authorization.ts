import { z } from "zod";

export const appRoles = ["user", "manager", "admin"] as const;
export const appRoleSchema = z.enum(appRoles);
export type AppRole = z.infer<typeof appRoleSchema>;

export const permissionScopes = ["app", "admin"] as const;
export const permissionScopeSchema = z.enum(permissionScopes);
export type PermissionScope = z.infer<typeof permissionScopeSchema>;

export const appPermissions = [
	"demo.todos.access",
	"demo.todos.mutate",
	"demo.files.access",
	"demo.files.mutate",
	"demo.address-form.access",
	"demo.address-form.mutate",
	"demo.table.access",
	"demo.massive-data.access",
	"admin.users.access",
	"admin.users.roles.mutate",
	"admin.users.impersonation.mutate",
	"admin.permissions.app.access",
	"admin.permissions.app.mutate",
	"admin.permissions.admin.access",
	"admin.permissions.admin.mutate",
] as const;
export const appPermissionSchema = z.enum(appPermissions);
export type AppPermission = z.infer<typeof appPermissionSchema>;

type PermissionMeta = {
	label: string;
	description: string;
	group:
		| "Todos"
		| "Files"
		| "Address Forms"
		| "Table Demo"
		| "Massive Data"
		| "Users"
		| "Permissions";
	action: "access" | "mutate";
	scope: PermissionScope;
};

export const appPermissionCatalog: Record<AppPermission, PermissionMeta> = {
	"demo.todos.access": {
		label: "Todos Access",
		description: "Open todo demo pages and read todo lists.",
		group: "Todos",
		action: "access",
		scope: "app",
	},
	"demo.todos.mutate": {
		label: "Todos Mutations",
		description: "Create, toggle, and delete todos.",
		group: "Todos",
		action: "mutate",
		scope: "app",
	},
	"demo.files.access": {
		label: "File Upload Access",
		description: "Open file demo pages and list existing files.",
		group: "Files",
		action: "access",
		scope: "app",
	},
	"demo.files.mutate": {
		label: "File Upload Mutations",
		description: "Create upload URLs and add/delete files.",
		group: "Files",
		action: "mutate",
		scope: "app",
	},
	"demo.address-form.access": {
		label: "Address Form Access",
		description: "Open the address form page and read submissions.",
		group: "Address Forms",
		action: "access",
		scope: "app",
	},
	"demo.address-form.mutate": {
		label: "Address Form Mutations",
		description: "Submit new address form entries.",
		group: "Address Forms",
		action: "mutate",
		scope: "app",
	},
	"demo.table.access": {
		label: "Table Demo Access",
		description: "Open the TanStack Table demo.",
		group: "Table Demo",
		action: "access",
		scope: "app",
	},
	"demo.massive-data.access": {
		label: "Massive Data Access",
		description: "Open the massive data demo.",
		group: "Massive Data",
		action: "access",
		scope: "app",
	},
	"admin.users.access": {
		label: "Users Admin Access",
		description: "Open the admin users dashboard.",
		group: "Users",
		action: "access",
		scope: "admin",
	},
	"admin.users.roles.mutate": {
		label: "User Role Mutations",
		description: "Change user roles from the admin users page.",
		group: "Users",
		action: "mutate",
		scope: "admin",
	},
	"admin.users.impersonation.mutate": {
		label: "Impersonation Mutations",
		description: "Start and stop admin impersonation sessions.",
		group: "Users",
		action: "mutate",
		scope: "admin",
	},
	"admin.permissions.app.access": {
		label: "App Matrix Access",
		description: "Open the app permissions matrix view.",
		group: "Permissions",
		action: "access",
		scope: "admin",
	},
	"admin.permissions.app.mutate": {
		label: "App Matrix Mutations",
		description: "Update app permission assignments.",
		group: "Permissions",
		action: "mutate",
		scope: "admin",
	},
	"admin.permissions.admin.access": {
		label: "Admin Matrix Access",
		description: "Open the admin permissions matrix view.",
		group: "Permissions",
		action: "access",
		scope: "admin",
	},
	"admin.permissions.admin.mutate": {
		label: "Admin Matrix Mutations",
		description: "Update admin permission assignments.",
		group: "Permissions",
		action: "mutate",
		scope: "admin",
	},
};

export const defaultRolePermissionMatrix: Record<AppRole, readonly AppPermission[]> = {
	user: ["demo.todos.access", "demo.todos.mutate", "demo.massive-data.access"],
	manager: [
		"demo.todos.access",
		"demo.todos.mutate",
		"demo.files.access",
		"demo.files.mutate",
		"demo.address-form.access",
		"demo.address-form.mutate",
		"demo.table.access",
		"demo.massive-data.access",
	],
	admin: appPermissions,
};

export function normalizeRole(value: unknown): AppRole {
	return isAppRole(value) ? value : "user";
}

export function isAppRole(value: unknown): value is AppRole {
	return typeof value === "string" && appRoles.some((role) => role === value);
}

export function isAppPermission(value: unknown): value is AppPermission {
	return typeof value === "string" && appPermissions.some((permission) => permission === value);
}

export function normalizePermissionList(permissions: readonly unknown[]): AppPermission[] {
	const normalizedPermissions = permissions.filter(isAppPermission);

	return [...new Set(normalizedPermissions)];
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
