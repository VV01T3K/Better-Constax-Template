import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

export type NavItem = {
	to: string;
	label: string;
	icon: LucideIcon;
};

export function NavMain({ label, items }: { label: string; items: NavItem[] }) {
	if (items.length === 0) return null;

	return (
		<SidebarGroup>
			<SidebarGroupLabel>{label}</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => (
					<SidebarMenuItem key={item.to}>
						<SidebarMenuButton
							render={
								<Link to={item.to} activeProps={{ "data-active": true }} aria-label={item.label} />
							}
						>
							<item.icon />
							<span>{item.label}</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
