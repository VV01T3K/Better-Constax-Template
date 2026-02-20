import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import type { AppPermission } from "@convex/schemas";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
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
	UserCog,
	UserRoundCheck,
	X,
	Zap,
	type LucideIcon,
} from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";

import { authClient } from "@/lib/auth-client";

const demoLinks = [
	{ to: "/demo/convex-query", label: "Convex + TQ", icon: Globe, permission: "demo.todos.manage" },
	{
		to: "/demo/tanstack-optimistic",
		label: "TQ Optimistic",
		icon: Zap,
		permission: "demo.todos.manage",
	},
	{
		to: "/demo/massive-data",
		label: "Massive Data",
		icon: Database,
		permission: "demo.massive-data.view",
	},
	{ to: "/demo/file-upload", label: "File Upload", icon: Upload, permission: "demo.files.manage" },
	{ to: "/demo/table", label: "TanStack Table", icon: Table, permission: "demo.table.view" },
	{
		to: "/demo/form/address",
		label: "Address Form",
		icon: ClipboardType,
		permission: "demo.address-form.manage",
	},
] as const;

const adminLinks = [
	{
		to: "/admin/users",
		label: "Users",
		icon: UserCog,
		permission: "admin.users.view",
	},
	{
		to: "/admin/permissions",
		label: "Permissions",
		icon: ShieldCheck,
		permission: "admin.permissions.view",
	},
] as const;

type NavTarget =
	| "/"
	| "/auth/login"
	| (typeof demoLinks)[number]["to"]
	| (typeof adminLinks)[number]["to"];

const noopSubscribe = () => () => {};

function hasAccess(
	permissionSet: ReadonlySet<AppPermission>,
	permission: (typeof demoLinks)[number]["permission"] | (typeof adminLinks)[number]["permission"],
) {
	return permissionSet.has(permission);
}

export default function Header() {
	const currentUserQuery = convexQuery(api.auth.getCurrentUser, {});
	const filesQuery = convexQuery(api.functions.files.list, {});
	const accessQuery = convexQuery(api.functions.authorization.getMyAccess, {});
	const { data: currentUser } = useSuspenseQuery(currentUserQuery);
	const { data: myAccess } = useSuspenseQuery(accessQuery);
	const { data: sessionData, isPending: isSessionPending } = authClient.useSession();
	const { isLoading: isAuthLoading } = useConvexAuth();
	const [isOpen, setIsOpen] = useState(false);
	const isHydrated = useSyncExternalStore(
		noopSubscribe,
		() => true,
		() => false,
	);
	const queryClient = useQueryClient();
	const router = useRouter();
	const showAuthPlaceholder = !isHydrated || isAuthLoading || isSessionPending;

	const permissionSet = useMemo(() => {
		return new Set<AppPermission>(myAccess?.permissions ?? []);
	}, [myAccess?.permissions]);
	const visibleDemoLinks = demoLinks.filter((item) => hasAccess(permissionSet, item.permission));
	const visibleAdminLinks = adminLinks.filter((item) => hasAccess(permissionSet, item.permission));

	const stopAuditMutation = useMutation({
		mutationFn: useConvexMutation(api.functions.impersonationAudit.stop),
	});

	const handleSignOut = async () => {
		await authClient.signOut().catch(() => undefined);
		queryClient.setQueryData(currentUserQuery.queryKey, null);
		queryClient.removeQueries({ queryKey: filesQuery.queryKey });
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: currentUserQuery.queryKey }),
			queryClient.invalidateQueries({ queryKey: accessQuery.queryKey }),
			router.invalidate(),
		]);
		await router.navigate({ to: "/auth/login", replace: true });
		setIsOpen(false);
	};

	const handleStopImpersonation = async () => {
		const targetUserId = sessionData?.user?.id;
		const result = await authClient.admin.stopImpersonating();
		if (result.error) {
			return;
		}

		if (targetUserId) {
			await stopAuditMutation
				.mutateAsync({
					targetUserId,
					source: "header-stop-impersonation",
				})
				.catch(() => undefined);
		}

		await Promise.all([
			queryClient.invalidateQueries({ queryKey: currentUserQuery.queryKey }),
			queryClient.invalidateQueries({ queryKey: accessQuery.queryKey }),
			router.invalidate(),
		]);
		await router.navigate({ to: "/" });
	};

	const isImpersonating = Boolean(sessionData?.session?.impersonatedBy);

	return (
		<>
			{isImpersonating ? (
				<div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-700 bg-amber-900 px-4 py-2 text-sm text-amber-50">
					<div className="flex items-center gap-2">
						<UserRoundCheck size={16} />
						<span>
							Impersonating{" "}
							<strong>{sessionData?.user?.email ?? sessionData?.user?.name ?? "user"}</strong>
						</span>
					</div>
					<button
						type="button"
						onClick={() => {
							void handleStopImpersonation();
						}}
						className="rounded-md bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-white"
					>
						Stop Impersonation
					</button>
				</div>
			) : null}

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
					<div className="space-y-1">
						<NavLinkItem to="/" label="Home" icon={Home} onNavigate={() => setIsOpen(false)} />
					</div>

					<div className="mt-4 mb-4">
						<div className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold tracking-wide text-cyan-300 uppercase">
							<ShieldCheck size={14} />
							Demos
						</div>
						<div className="space-y-1">
							{visibleDemoLinks.map((item) => (
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

					{visibleAdminLinks.length > 0 ? (
						<div className="mb-4">
							<div className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold tracking-wide text-orange-300 uppercase">
								<ShieldCheck size={14} />
								Admin
							</div>
							<div className="space-y-1">
								{visibleAdminLinks.map((item) => (
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
					) : null}

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
