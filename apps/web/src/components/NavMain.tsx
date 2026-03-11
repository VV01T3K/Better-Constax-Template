import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@repo/ui/components/sidebar";
import { getHotkeyManager } from "@tanstack/react-hotkeys";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { FilePenLine, FolderUp, Globe, Home, Layers3, ListOrdered, Radar } from "lucide-react";
import { useEffect } from "react";

const navLinks = [
	{ to: "/", label: "Home", icon: Home, hotkey: "1" },
	{ to: "/demo/tanstack-form", label: "TanStack Form", icon: FilePenLine, hotkey: "2" },
	{ to: "/demo/shadcn", label: "shadcn Demo", icon: Layers3, hotkey: "3" },
	{ to: "/demo/convex", label: "Convex", icon: Globe, hotkey: "4" },
	{ to: "/demo/convex-optimistic", label: "Convex Optimistic", icon: Globe, hotkey: "5" },
	{ to: "/demo/file-upload", label: "File Upload", icon: FolderUp, hotkey: "6" },
	{ to: "/demo/convex-pagination", label: "Convex Pagination", icon: ListOrdered, hotkey: "7" },
	{ to: "/demo/convex-infinite", label: "Convex Infinite", icon: Radar, hotkey: "8" },
] as const;

function NavHotkeys() {
	const navigate = useNavigate();

	useEffect(() => {
		const hotkeyManager = getHotkeyManager();
		const registrations = navLinks.map((link) =>
			hotkeyManager.register(link.hotkey, () => navigate({ to: link.to })),
		);

		return () => {
			registrations.forEach((registration) => registration.unregister());
		};
	}, [navigate]);

	return null;
}

export function NavMain() {
	const location = useLocation();

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Navigation</SidebarGroupLabel>
			<NavHotkeys />
			<SidebarMenu>
				{navLinks.map((link) => (
					<SidebarMenuItem key={link.to}>
						<SidebarMenuButton
							tooltip={`${link.label} (${link.hotkey})`}
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
