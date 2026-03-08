import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { Globe, Home, Layers3, LogIn, LogOut, Menu, Network, X } from "lucide-react";
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
		<>
			<header className="flex items-center bg-gray-800 p-4 text-white shadow-lg">
				<button
					onClick={() => setIsOpen(true)}
					className="rounded-lg p-2 transition-colors hover:bg-gray-700"
					aria-label="Open menu"
				>
					<Menu size={24} />
				</button>
				<h1 className="ml-4 text-xl font-semibold">
					<Link to="/">
						<img src="/tanstack-word-logo-white.svg" alt="TanStack Logo" className="h-10" />
					</Link>
				</h1>
				<div className="ml-auto">
					{isAuthenticated ? (
						<div className="flex items-center gap-3">
							<span className="max-w-37.5 truncate text-sm text-cyan-200">{authIdentity.name}</span>
							<button
								type="button"
								onClick={() => void signOut()}
								disabled={isSigningOut}
								className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
							>
								<LogOut size={16} />
								{isSigningOut ? "Signing out..." : "Sign Out"}
							</button>
						</div>
					) : (
						<Link
							to="/auth"
							search={signInRedirectSearch}
							className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
						>
							<LogIn size={16} />
							Sign In
						</Link>
					)}
				</div>
			</header>

			<aside
				className={`fixed top-0 left-0 z-50 flex h-full w-80 transform flex-col bg-gray-900 text-white shadow-2xl transition-transform duration-300 ease-in-out ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between border-b border-gray-700 p-4">
					<h2 className="text-xl font-bold">Navigation</h2>
					<button
						onClick={() => setIsOpen(false)}
						className="rounded-lg p-2 transition-colors hover:bg-gray-800"
						aria-label="Close menu"
					>
						<X size={24} />
					</button>
				</div>

				<nav className="flex-1 overflow-y-auto p-4">
					<Link
						to="/"
						onClick={() => setIsOpen(false)}
						className="mb-2 flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-800"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
						}}
					>
						<Home size={20} />
						<span className="font-medium">Home</span>
					</Link>

					{/* Demo Links Start */}

					<Link
						to="/demo/tanstack-query"
						onClick={() => setIsOpen(false)}
						className="mb-2 flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-800"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
						}}
					>
						<Network size={20} />
						<span className="font-medium">TanStack Query</span>
					</Link>

					<Link
						to="/demo/shadcn"
						onClick={() => setIsOpen(false)}
						className="mb-2 flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-800"
						activeProps={{
							className:
								"flex items-center gap-3 rounded-lg bg-cyan-600 p-3 transition-colors hover:bg-cyan-700 mb-2",
						}}
					>
						<Layers3 size={20} />
						<span className="font-medium">shadcn Demo</span>
					</Link>

					<Link
						to="/demo/convex"
						onClick={() => setIsOpen(false)}
						className="mb-2 flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-800"
						activeProps={{
							className:
								"flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2",
						}}
					>
						<Globe size={20} />
						<span className="font-medium">Convex</span>
					</Link>

					{/* Demo Links End */}
				</nav>
			</aside>
		</>
	);
}
