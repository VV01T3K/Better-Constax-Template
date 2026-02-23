import { convexQuery } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";

import { PermissionMatrixEditor } from "@/components/admin/PermissionMatrixEditor";
import { protectedRouteLoader } from "@/lib/route-guard-kit";

export const Route = createFileRoute("/admin/permissions/admin")({
	loader: async ({ context, location }) => {
		await protectedRouteLoader({
			queryClient: context.queryClient,
			permission: "admin.permissions.admin.access",
			redirectHref: location.href,
			prefetch: () =>
				context.queryClient.ensureQueryData(
					convexQuery(api.functions.authorization.getCatalogAndMatrix, { scope: "admin" }),
				),
		});
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
