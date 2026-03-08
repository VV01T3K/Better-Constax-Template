import { Button } from "@repo/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@repo/ui/components/sidebar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { ChevronsUpDownIcon, LogInIcon, LogOutIcon, UserIcon } from "lucide-react";

import { useSignOutMutationOptions } from "../integrations/convex/auth-client";
import {
	DEFAULT_REDIRECT_TARGET,
	getAuthRedirectSearch,
	getAuthRouteNavigateOptions,
	getRedirectTargetFromRouterLocation,
	isAuthPath,
	isProtectedRouteMatch,
} from "../integrations/convex/auth-redirect";
import type { AuthIdentity } from "../integrations/convex/auth-state";
import {
	markSignedOutAuthIdentity,
	prepareSignedOutSession,
	restoreSignedOutSession,
} from "../integrations/convex/auth-state";

export function NavUser({ authIdentity }: { authIdentity: AuthIdentity }) {
	const { isMobile } = useSidebar();
	const router = useRouter();
	const location = useLocation();
	const queryClient = useQueryClient();

	const isAuthenticated = authIdentity !== null;
	const isAuthRoute = isAuthPath(location.pathname);
	const locationTarget = getRedirectTargetFromRouterLocation(location);
	const redirectTarget = isAuthRoute ? DEFAULT_REDIRECT_TARGET : locationTarget;
	const signInRedirectSearch = getAuthRedirectSearch(redirectTarget);

	const signOutMutationOptions = useSignOutMutationOptions({
		onMutate: async () => {
			const snapshot = await prepareSignedOutSession(queryClient);

			if (isProtectedRouteMatch(router.state.matches)) {
				await router.navigate(getAuthRouteNavigateOptions(redirectTarget));
			}

			return snapshot;
		},
		onSuccess: async () => {
			await markSignedOutAuthIdentity(queryClient);

			if (isProtectedRouteMatch(router.state.matches)) {
				await router.navigate(getAuthRouteNavigateOptions(redirectTarget));
			}
		},
		onError: (error, _variables, snapshot) => {
			restoreSignedOutSession(queryClient, snapshot);
			// oxlint-disable-next-line eslint/no-console
			console.error("[NavUser] Sign-out failed:", error);
		},
	});
	const { mutateAsync: signOut, isPending: isSigningOut } = useMutation(signOutMutationOptions);

	if (!isAuthenticated) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<Button
						variant="outline"
						className="w-full"
						render={<Link to="/auth" search={signInRedirectSearch} />}
					>
						<LogInIcon />
						Sign In
					</Button>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={<SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />}
					>
						<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
							<UserIcon className="size-4" />
						</div>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">{authIdentity.name}</span>
						</div>
						<ChevronsUpDownIcon className="ml-auto size-4" />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
									<UserIcon className="size-4" />
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">{authIdentity.name}</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={() => void signOut()} disabled={isSigningOut}>
							<LogOutIcon />
							{isSigningOut ? "Signing out..." : "Sign Out"}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
