import {
	AiNetworkIcon,
	GlobeIcon,
	Home01Icon,
	Layers01Icon,
	Login01Icon,
	Logout01Icon,
	Menu01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@repo/ui/components/button";
import { Separator } from "@repo/ui/components/separator";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@repo/ui/components/sheet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { useSignOutMutationOptions } from "../integrations/convex/auth-client";
import {
	DEFAULT_REDIRECT_TARGET,
	getAuthRedirectSearch,
	getAuthRouteNavigateOptions,
	getRedirectTargetFromRouterLocation,
	isAuthPath,
	isProtectedRouteMatch,
} from "../integrations/convex/auth-redirect";
import {
	getAuthIdentityQueryOptions,
	markSignedOutAuthIdentity,
	prepareSignedOutSession,
	restoreSignedOutSession,
} from "../integrations/convex/auth-state";

const navLinks = [
	{ to: "/", label: "Home", icon: Home01Icon },
	{ to: "/demo/tanstack-query", label: "TanStack Query", icon: AiNetworkIcon },
	{ to: "/demo/shadcn", label: "shadcn Demo", icon: Layers01Icon },
	{ to: "/demo/convex", label: "Convex", icon: GlobeIcon },
] as const;

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const router = useRouter();
	const location = useLocation();
	const queryClient = useQueryClient();
	const { data: authIdentity } = useQuery(getAuthIdentityQueryOptions());
	const isAuthenticated = authIdentity !== undefined && authIdentity !== null;
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
			console.error("[Header] Sign-out failed:", error);
		},
	});
	const { mutateAsync: signOut, isPending: isSigningOut } = useMutation(signOutMutationOptions);

	return (
		<header className="border-border bg-card text-card-foreground flex items-center border-b p-4">
			<Sheet open={isOpen} onOpenChange={setIsOpen}>
				<SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open menu" />}>
					<HugeiconsIcon icon={Menu01Icon} size={24} strokeWidth={2} />
				</SheetTrigger>
				<SheetContent side="left" className="w-80">
					<SheetHeader>
						<SheetTitle>Navigation</SheetTitle>
					</SheetHeader>
					<Separator />
					<nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
						{navLinks.map((link) => (
							<Link
								key={link.to}
								to={link.to}
								onClick={() => setIsOpen(false)}
								className="hover:bg-muted flex items-center gap-3 rounded-sm p-3 transition-colors"
								activeProps={{
									className:
										"flex items-center gap-3 rounded-sm p-3 bg-primary text-primary-foreground transition-colors hover:bg-primary/90",
								}}
							>
								<HugeiconsIcon icon={link.icon} size={20} strokeWidth={2} />
								<span className="font-medium">{link.label}</span>
							</Link>
						))}
					</nav>
				</SheetContent>
			</Sheet>

			<h1 className="ml-4 text-xl font-semibold">
				<Link to="/">
					<img src="/tanstack-word-logo-white.svg" alt="TanStack Logo" className="h-10" />
				</Link>
			</h1>

			<div className="ml-auto">
				{isAuthenticated ? (
					<div className="flex items-center gap-3">
						<span className="text-muted-foreground max-w-37.5 truncate text-sm">
							{authIdentity.name}
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() => void signOut()}
							disabled={isSigningOut}
						>
							<HugeiconsIcon icon={Logout01Icon} size={16} strokeWidth={2} />
							{isSigningOut ? "Signing out..." : "Sign Out"}
						</Button>
					</div>
				) : (
					<Button
						variant="outline"
						size="sm"
						render={<Link to="/auth" search={signInRedirectSearch} />}
					>
						<HugeiconsIcon icon={Login01Icon} size={16} strokeWidth={2} />
						Sign In
					</Button>
				)}
			</div>
		</header>
	);
}
