import { Link } from "@tanstack/react-router";
import { ChevronsUpDownIcon, LogInIcon, LogOutIcon, UserRoundCheckIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";

function getInitials(name: string) {
	return name
		.split(" ")
		.map((part) => part[0])
		.filter(Boolean)
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

export function NavUser({
	user,
	isLoggedIn,
	isImpersonating,
	onSignOut,
	onStopImpersonation,
}: {
	user: { name: string; email: string } | null;
	isLoggedIn: boolean;
	isImpersonating: boolean;
	onSignOut: () => void;
	onStopImpersonation: () => void;
}) {
	const { isMobile } = useSidebar();

	if (!isLoggedIn || !user) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton size="lg" render={<Link to="/auth/login" aria-label="Sign In" />}>
						<LogInIcon className="size-4" />
						<span>Sign In</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	const initials = getInitials(user.name || user.email);

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={<SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />}
					>
						<Avatar>
							<AvatarFallback>{initials}</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">{user.name}</span>
							<span className="text-muted-foreground truncate text-xs">{user.email}</span>
						</div>
						<ChevronsUpDownIcon className="ml-auto size-4" />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuGroup>
							<DropdownMenuLabel className="p-0 font-normal">
								<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
									<Avatar>
										<AvatarFallback>{initials}</AvatarFallback>
									</Avatar>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-medium">{user.name}</span>
										<span className="text-muted-foreground truncate text-xs">{user.email}</span>
									</div>
								</div>
							</DropdownMenuLabel>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						{isImpersonating ? (
							<>
								<DropdownMenuItem onClick={onStopImpersonation}>
									<UserRoundCheckIcon />
									Stop Impersonation
								</DropdownMenuItem>
								<DropdownMenuSeparator />
							</>
						) : null}
						<DropdownMenuItem onClick={onSignOut}>
							<LogOutIcon />
							Sign Out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
