import { Link, useRouteContext, useRouter } from "@tanstack/react-router";
import { LogIn, LogOut, User } from "lucide-react";

import { authClient } from "@/lib/auth-client";

export default function Header() {
	const router = useRouter();
	const { isAuthenticated, currentUser } = useRouteContext({ from: "__root__" });

	return (
		<header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
			<div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between px-4">
				<div className="flex items-center gap-3">
					<Link to="/" className="text-lg font-semibold text-white">
						Better Constax
					</Link>
					<nav className="ml-4 hidden items-center gap-2 md:flex">
						<NavLink to="/app">App</NavLink>
						<NavLink to="/events">Events</NavLink>
						<NavLink to="/demo/db-optimistic">TanStack DB Demo</NavLink>
					</nav>
				</div>

				<div className="flex items-center gap-3">
					{isAuthenticated && currentUser ? (
						<>
							<span className="hidden items-center gap-2 text-sm text-slate-300 sm:flex">
								<User size={16} />
								{currentUser.name || currentUser.email || currentUser.subject}
							</span>
							<button
								type="button"
								onClick={async () => {
									await authClient.signOut();
									await router.invalidate();
								}}
								className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-700"
							>
								<LogOut size={16} />
								Sign out
							</button>
						</>
					) : (
						<Link
							to="/app"
							className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-3 py-1.5 text-sm text-white hover:bg-cyan-500"
						>
							<LogIn size={16} />
							Sign in
						</Link>
					)}
				</div>
			</div>
		</header>
	);
}

function NavLink({
	to,
	children,
}: {
	to: "/app" | "/events" | "/demo/db-optimistic";
	children: string;
}) {
	return (
		<Link
			to={to}
			className="rounded-md px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
			activeProps={{
				className: "rounded-md bg-slate-800 px-3 py-1.5 text-sm text-white",
			}}
		>
			{children}
		</Link>
	);
}
