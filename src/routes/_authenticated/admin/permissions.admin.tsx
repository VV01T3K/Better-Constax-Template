import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { PermissionMatrixEditor } from "@/components/admin/PermissionMatrixEditor";

export const Route = createFileRoute("/_authenticated/admin/permissions/admin")({
	beforeLoad: async ({ context }) => {
		const allowed = await context.queryClient.fetchQuery({
			...convexQuery(api.functions.authorization.hasPermission, {
				permission: "admin.permissions.admin.access",
			}),
			staleTime: 0,
		});
		if (!allowed) throw redirect({ to: "/forbidden" });
	},
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			convexQuery(api.functions.authorization.getCatalogAndMatrix, { scope: "admin" }),
		);
	},
	component: AdminPermissionsPage,
});

function AdminPermissionsPage() {
	return (
		<PermissionMatrixEditor
			scope="admin"
			title="Admin Permission Matrix"
			description="Configure who can access and mutate administrative capabilities, including user management, impersonation, and permission editing."
		/>
	);
}
