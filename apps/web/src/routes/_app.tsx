import { SidebarInset, SidebarProvider, SidebarTrigger } from "@repo/ui/components/sidebar";
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
				<header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 flex items-center gap-3 border-b px-4 py-3 backdrop-blur md:hidden">
					<SidebarTrigger className="-ml-1" />
					<div className="min-w-0">
						<p className="text-foreground truncate text-sm font-medium">Constax</p>
					</div>
				</header>
				<div className="flex flex-1 flex-col gap-4 p-4">
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
