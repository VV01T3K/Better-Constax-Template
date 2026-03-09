import { Avatar, AvatarFallback } from "@repo/ui/components/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@repo/ui/components/sidebar";
import { Link } from "@tanstack/react-router";
import { ChevronsUpDownIcon, Layers3Icon } from "lucide-react";

import { ThemeMenu } from "./ThemeMenu";

export function TeamSwitcher() {
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={<SidebarMenuButton size="lg" className="data-[open=true]:bg-sidebar-accent" />}
					>
						<Avatar shape="square">
							<AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
								<Layers3Icon className="size-4" />
							</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">TanStack Start</span>
							<span className="truncate text-xs">Starter Template</span>
						</div>
						<ChevronsUpDownIcon className="ml-auto size-4" />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="min-w-56 rounded-none"
						side="bottom"
						align="start"
						sideOffset={4}
					>
						<DropdownMenuGroup>
							<DropdownMenuLabel className="text-foreground p-0 font-normal">
								<div className="flex items-center gap-2 px-2 py-2 text-left text-xs">
									<Avatar shape="square">
										<AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
											<Layers3Icon className="size-4" />
										</AvatarFallback>
									</Avatar>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-medium">TanStack Start</span>
										<span className="text-muted-foreground truncate text-xs">Starter Template</span>
									</div>
								</div>
							</DropdownMenuLabel>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<ThemeMenu />
						<DropdownMenuGroup>
							<DropdownMenuItem render={<Link to="/" />}>Open workspace</DropdownMenuItem>
							<DropdownMenuItem disabled>Single-workspace template</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
