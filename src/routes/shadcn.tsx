import { createFileRoute } from "@tanstack/react-router";

import { AppSidebar } from "@/components/app-sidebar";
import { ComponentExample } from "@/components/component-example";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/shadcn")({ component: ShadcnPage });

function ShadcnPage() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<span className="text-sm font-medium">shadcn Components</span>
				</header>
				<div className="flex flex-1 flex-col">
					<ComponentExample />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
