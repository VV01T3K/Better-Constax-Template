import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@repo/ui/components/sidebar";
import { useQuery } from "@tanstack/react-query";

import { getAuthIdentityQueryOptions } from "../integrations/convex/auth-state";
import { NavMain } from "./NavMain";
import { NavUser } from "./NavUser";
import { TeamSwitcher } from "./TeamSwitcher";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { data: authIdentity } = useQuery(getAuthIdentityQueryOptions());

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<TeamSwitcher />
			</SidebarHeader>
			<SidebarContent>
				<NavMain />
			</SidebarContent>
			<SidebarFooter>
				<NavUser authIdentity={authIdentity ?? null} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
