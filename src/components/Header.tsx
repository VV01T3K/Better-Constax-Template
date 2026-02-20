import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import {
	ClipboardType,
	Database,
	Globe,
	Home,
	LogIn,
	LogOut,
	Menu,
	ShieldCheck,
	Table,
	Upload,
	User,
	X,
	Zap,
	type LucideIcon,
} from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { authClient } from "@/lib/auth-client";

const coreLinks = [
	{ to: "/", label: "Home", icon: Home },
	{ to: "/demo/convex-query", label: "Convex + TQ", icon: Globe },
	{ to: "/demo/tanstack-optimistic", label: "TQ Optimistic", icon: Zap },
	{ to: "/demo/massive-data", label: "Massive Data", icon: Database },
	{ to: "/demo/file-upload", label: "File Upload", icon: Upload },
	{ to: "/demo/table", label: "TanStack Table", icon: Table },
	{ to: "/demo/form/address", label: "Address Form", icon: ClipboardType },
] as const;

type NavTarget = (typeof coreLinks)[number]["to"] | "/auth/login";

const noopSubscribe = () => () => {};

export default function Header() {
	const currentUserQuery = convexQuery(api.auth.getCurrentUser, {});
	const filesQuery = convexQuery(api.functions.files.list, {});
	const { data: currentUser } = useSuspenseQuery(currentUserQuery);
	const { isLoading: isAuthLoading } = useConvexAuth();
	const [isOpen, setIsOpen] = useState(false);
	const isHydrated = useSyncExternalStore(
		noopSubscribe,
		() => true,
		() => false,
	);
	const queryClient = useQueryClient();
	const router = useRouter();
	const showAuthPlaceholder = !isHydrated || isAuthLoading;

	const handleSignOut = async () => {
		await authClient.signOut().catch(() => undefined);
		queryClient.setQueryData(currentUserQuery.queryKey, null);
		queryClient.removeQueries({ queryKey: filesQuery.queryKey });
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: currentUserQuery.queryKey }),
			router.invalidate(),
		]);
		await router.navigate({ to: "/auth/login", replace: true });
		setIsOpen(false);
	};

	return (
		<>
			<header className="flex items-center justify-between bg-gray-800 p-4 text-white shadow-lg">
				<div className="flex items-center">
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
				</div>

				<div className="flex items-center gap-3">
					{showAuthPlaceholder ? (
						<div className="h-8 w-24 animate-pulse rounded-lg bg-gray-700" aria-hidden="true" />
					) : currentUser ? (
						<>
							<span className="flex items-center gap-2 text-sm text-gray-300">
								<User size={16} />
								{currentUser.name || currentUser.email || currentUser.subject}
							</span>
							<button
								onClick={() => {
									void handleSignOut();
								}}
								className="flex items-center gap-2 rounded-lg bg-gray-700 px-3 py-1.5 text-sm transition-colors hover:bg-gray-600"
							>
								<LogOut size={16} />
								Sign Out
							</button>
						</>
					) : (
						<Link
							to="/auth/login"
							className="flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm transition-colors hover:bg-cyan-700"
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
					<div className="mb-4">
						<div className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold tracking-wide text-cyan-300 uppercase">
							<ShieldCheck size={14} />
							Demos
						</div>
						<div className="space-y-1">
							{coreLinks.map((item) => (
								<NavLinkItem
									key={item.to}
									to={item.to}
									label={item.label}
									icon={item.icon}
									onNavigate={() => setIsOpen(false)}
								/>
							))}
						</div>
					</div>

					<div className="mt-2 border-t border-gray-700 pt-2">
						{showAuthPlaceholder ? (
							<div className="mb-2 h-12 animate-pulse rounded-lg bg-gray-800" aria-hidden="true" />
						) : currentUser ? (
							<button
								type="button"
								onClick={() => {
									void handleSignOut();
								}}
								className="mb-2 flex w-full items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-800"
							>
								<LogOut size={20} />
								<span className="font-medium">Sign Out</span>
							</button>
						) : (
							<NavLinkItem
								to="/auth/login"
								label="Login / Sign Up"
								icon={LogIn}
								onNavigate={() => setIsOpen(false)}
							/>
						)}
					</div>
				</nav>
			</aside>
		</>
	);
}

function NavLinkItem({
	to,
	label,
	icon: Icon,
	onNavigate,
}: {
	to: NavTarget;
	label: string;
	icon: LucideIcon;
	onNavigate: () => void;
}) {
	return (
		<Link
			to={to}
			onClick={onNavigate}
			className="flex items-center gap-3 rounded-lg p-3 text-sm transition-colors hover:bg-gray-800"
			activeProps={{
				className:
					"flex items-center gap-3 rounded-lg bg-cyan-600 p-3 text-sm transition-colors hover:bg-cyan-700",
			}}
		>
			<Icon size={18} />
			<span className="font-medium">{label}</span>
		</Link>
	);
}
