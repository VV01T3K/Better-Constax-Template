import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router";

import { PermissionMatrixEditor } from "@/components/admin/PermissionMatrixEditor";
import { requireRoutePermission } from "@/lib/route-guards";

export const Route = createFileRoute("/admin/permissions")({
	loader: async ({ context, location }) => {
		const isAdminPermissionsPath = location.pathname.startsWith("/admin/permissions/admin");
		const permission = isAdminPermissionsPath
			? "admin.permissions.admin.access"
			: "admin.permissions.app.access";
		const scope = isAdminPermissionsPath ? "admin" : "app";

		await requireRoutePermission({
			queryClient: context.queryClient,
			permission,
			redirectHref: location.href,
		});

		await context.queryClient.ensureQueryData(
			convexQuery(api.functions.authorization.getCatalogAndMatrix, { scope }),
		);
	},
	component: AppPermissionsPage,
});

function AppPermissionsPage() {
	const location = useLocation();
	const isAdminPermissionsPath = location.pathname.startsWith("/admin/permissions/admin");
	if (isAdminPermissionsPath) {
		return <Outlet />;
	}

	return (
		<PermissionMatrixEditor
			scope="app"
			title="Application Permission Matrix"
			description="Configure app feature access and mutation capabilities per role. Access controls route/data visibility while mutations control write actions."
		/>
	);
}
