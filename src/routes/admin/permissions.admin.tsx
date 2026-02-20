import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";

import { PermissionMatrixEditor } from "@/components/admin/PermissionMatrixEditor";
import { requireRoutePermission } from "@/lib/route-guards";

export const Route = createFileRoute("/admin/permissions/admin")({
	loader: async ({ context, location }) => {
		await requireRoutePermission({
			queryClient: context.queryClient,
			permission: "admin.permissions.admin.access",
			redirectHref: location.href,
		});

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
