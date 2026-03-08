import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@repo/ui/components/sidebar";
import { Link } from "@tanstack/react-router";
import { Layers3Icon } from "lucide-react";

export function TeamSwitcher() {
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton size="lg" render={<Link to="/" />}>
					<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
						<Layers3Icon className="size-4" />
					</div>
					<div className="grid flex-1 text-left text-sm leading-tight">
						<span className="truncate font-medium">TanStack Start</span>
						<span className="truncate text-xs">Starter Template</span>
					</div>
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
