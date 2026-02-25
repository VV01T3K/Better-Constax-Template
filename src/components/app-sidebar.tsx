import { Link } from "@tanstack/react-router";
import {
	ClipboardType,
	Database,
	Globe,
	Home,
	Layers,
	ShieldCheck,
	Table,
	Upload,
	UserCog,
	Zap,
	type LucideIcon,
} from "lucide-react";
import type * as React from "react";

import { NavMain, type NavItem } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";

type NavLinkDef = {
	to: string;
	label: string;
	icon: LucideIcon;
	permission: string;
};

const generalLinks: NavItem[] = [
	{ to: "/", label: "Home", icon: Home },
	{ to: "/shadcn", label: "shadcn UI", icon: Layers },
];

const demoLinkDefs: NavLinkDef[] = [
	{ to: "/demo/convex-query", label: "Convex + TQ", icon: Globe, permission: "demo.todos.access" },
	{
		to: "/demo/tanstack-optimistic",
		label: "TQ Optimistic",
		icon: Zap,
		permission: "demo.todos.access",
	},
	{
		to: "/demo/massive-data",
		label: "Massive Data",
		icon: Database,
		permission: "demo.massive-data.access",
	},
	{
		to: "/demo/file-upload",
		label: "File Upload",
		icon: Upload,
		permission: "demo.files.access",
	},
	{
		to: "/demo/table",
		label: "TanStack Table",
		icon: Table,
		permission: "demo.table.access",
	},
	{
		to: "/demo/form/address",
		label: "Address Form",
		icon: ClipboardType,
		permission: "demo.address-form.access",
	},
];

const adminLinkDefs: NavLinkDef[] = [
	{
		to: "/admin/users",
		label: "Users",
		icon: UserCog,
		permission: "admin.users.access",
	},
	{
		to: "/admin/permissions",
		label: "App Permissions",
		icon: ShieldCheck,
		permission: "admin.permissions.app.access",
	},
	{
		to: "/admin/permissions/admin",
		label: "Admin Permissions",
		icon: ShieldCheck,
		permission: "admin.permissions.admin.access",
	},
];

function filterByPermission(links: NavLinkDef[], permissions: ReadonlySet<string>): NavItem[] {
	return links
		.filter((link) => permissions.has(link.permission))
		.map(({ to, label, icon }) => ({ to, label, icon }));
}

export function AppSidebar({
	user,
	permissionSet,
	isLoggedIn,
	isImpersonating,
	onSignOut,
	onStopImpersonation,
	...props
}: React.ComponentProps<typeof Sidebar> & {
	user: { name: string; email: string } | null;
	permissionSet: ReadonlySet<string>;
	isLoggedIn: boolean;
	isImpersonating: boolean;
	onSignOut: () => void;
	onStopImpersonation: () => void;
}) {
	const visibleDemoLinks = filterByPermission(demoLinkDefs, permissionSet);
	const visibleAdminLinks = filterByPermission(adminLinkDefs, permissionSet);

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							render={<Link to="/" aria-label="Home" />}
						>
							<div className="flex aspect-square size-8 items-center justify-center">
								<picture>
									<source srcSet="/tanstack-circle-logo.avif" type="image/avif" />
									<img
										src="/tanstack-circle-logo.webp"
										alt="TanStack Logo"
										width={32}
										height={32}
										className="size-8"
									/>
								</picture>
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-semibold">TanStack Start</span>
								<span className="truncate text-xs text-muted-foreground">Full-Stack Template</span>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarMenu>
						{generalLinks.map((item) => (
							<SidebarMenuItem key={item.to}>
								<SidebarMenuButton
									tooltip={item.label}
									render={
										<Link
											to={item.to}
											activeProps={{ "data-active": true }}
											aria-label={item.label}
										/>
									}
								>
									<item.icon />
									<span>{item.label}</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroup>
				<NavMain label="Demos" items={visibleDemoLinks} />
				<NavMain label="Admin" items={visibleAdminLinks} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser
					user={user}
					isLoggedIn={isLoggedIn}
					isImpersonating={isImpersonating}
					onSignOut={onSignOut}
					onStopImpersonation={onStopImpersonation}
				/>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
