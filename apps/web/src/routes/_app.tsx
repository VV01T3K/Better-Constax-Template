import { SidebarInset, SidebarProvider } from "@repo/ui/components/sidebar";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import { AppSidebar } from "../components/AppSidebar";

export const Route = createFileRoute("/_app")({
	component: AppLayout,
});

function AppLayout() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<div className="flex flex-1 flex-col gap-4 p-4">
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
