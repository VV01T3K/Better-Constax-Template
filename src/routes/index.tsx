import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: HomeRoute,
});

function HomeRoute() {
	return (
		<div className="mx-auto w-full max-w-6xl px-6 py-14">
			<section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-8">
				<h1 className="text-4xl font-bold text-white">TanStack Start + Convex + Better Auth</h1>
				<p className="mt-3 max-w-3xl text-slate-300">
					Focused project setup with SSR-aware auth, a standard todo flow, and high-volume events
					infinite queries.
				</p>
				<div className="mt-6 flex flex-wrap gap-3">
					<HomeLink to="/app">Open App</HomeLink>
					<HomeLink to="/events">Open Events</HomeLink>
					<HomeLink to="/demo/db-optimistic">Open TanStack DB Demo</HomeLink>
				</div>
			</section>

			<section className="mt-6 grid gap-4 md:grid-cols-3">
				<Card
					title="/app"
					description="Standard Convex + TanStack Query todo experience with inline auth."
				/>
				<Card
					title="/events"
					description="Infinite events feed with both Convex and TanStack infinite modes plus virtualization."
				/>
				<Card
					title="/demo/db-optimistic"
					description="Local-first TanStack DB todo collection with optimistic persistence."
				/>
			</section>
		</div>
	);
}

function HomeLink({
	to,
	children,
}: {
	to: "/app" | "/events" | "/demo/db-optimistic";
	children: string;
}) {
	return (
		<Link
			to={to}
			className="rounded-md bg-cyan-600 px-4 py-2 font-medium text-white hover:bg-cyan-500"
		>
			{children}
		</Link>
	);
}

function Card({ title, description }: { title: string; description: string }) {
	return (
		<div className="rounded-xl border border-slate-700 bg-slate-900/40 p-5">
			<h2 className="text-lg font-semibold text-white">{title}</h2>
			<p className="mt-2 text-sm text-slate-300">{description}</p>
		</div>
	);
}
