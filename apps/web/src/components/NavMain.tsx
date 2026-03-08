import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@repo/ui/components/sidebar";
import { Link, useLocation } from "@tanstack/react-router";
import { Globe, Home, Layers3, Network } from "lucide-react";

const navLinks = [
	{ to: "/", label: "Home", icon: Home },
	{ to: "/demo/tanstack-query", label: "TanStack Query", icon: Network },
	{ to: "/demo/shadcn", label: "shadcn Demo", icon: Layers3 },
	{ to: "/demo/convex", label: "Convex", icon: Globe },
] as const;

export function NavMain() {
	const location = useLocation();

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Navigation</SidebarGroupLabel>
			<SidebarMenu>
				{navLinks.map((link) => (
					<SidebarMenuItem key={link.to}>
						<SidebarMenuButton
							tooltip={link.label}
							isActive={location.pathname === link.to}
							render={<Link to={link.to} />}
						>
							<link.icon />
							<span>{link.label}</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
