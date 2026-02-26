import { Link, Outlet } from "@tanstack/react-router";

import { useCurrentUser } from "@/lib/auth/hooks";

const linkClass =
	"rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted";

export function AppShell() {
	const user = useCurrentUser();

	return (
		<div className="min-h-screen bg-background text-foreground">
			<header className="border-b border-border">
				<div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3">
					<Link to="/" className={linkClass}>
						Home
					</Link>
					<Link to="/demo/todos" className={linkClass}>
						Todos
					</Link>
					<Link to="/demo/files" className={linkClass}>
						Files
					</Link>
					<Link to="/demo/address" className={linkClass}>
						Address
					</Link>
					<div className="ml-auto flex items-center gap-2">
						{user ? (
							<>
								<span className="text-sm text-muted-foreground">Signed in as {user.email}</span>
								<Link to="/auth/sign-out" className={linkClass}>
									Sign out
								</Link>
							</>
						) : (
							<>
								<Link to="/auth/sign-in" className={linkClass}>
									Sign in
								</Link>
								<Link to="/auth/sign-up" className={linkClass}>
									Sign up
								</Link>
							</>
						)}
					</div>
				</div>
			</header>
			<main className="mx-auto max-w-5xl p-4">
				<Outlet />
			</main>
		</div>
	);
}
