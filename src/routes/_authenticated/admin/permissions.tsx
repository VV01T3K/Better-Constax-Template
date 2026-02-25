import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { Outlet, createFileRoute, redirect, useLocation } from "@tanstack/react-router";

import { PermissionMatrixEditor } from "@/components/admin/PermissionMatrixEditor";

export const Route = createFileRoute("/_authenticated/admin/permissions")({
	beforeLoad: async ({ context, location }) => {
		const isAdminPermissionsPath = location.pathname.startsWith("/admin/permissions/admin");
		const permission = isAdminPermissionsPath
			? "admin.permissions.admin.access"
			: "admin.permissions.app.access";

		const allowed = await context.queryClient.fetchQuery({
			...convexQuery(api.functions.authorization.hasPermission, { permission }),
			staleTime: 0,
		});
		if (!allowed) throw redirect({ to: "/forbidden" });
	},
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			convexQuery(api.functions.authorization.getCatalogAndMatrix, { scope: "app" }),
		);
	},
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
