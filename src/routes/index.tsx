import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	return (
		<section className="space-y-4">
			<h1 className="text-3xl font-semibold tracking-tight">Better-Convex + Zod SSoT</h1>
			<p className="text-muted-foreground">
				This app uses better-convex cRPC, Better Auth, and shared Zod schemas for client/server
				validation parity.
			</p>
			<ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
				<li>Public reads</li>
				<li>Authenticated mutations</li>
				<li>Owner-only write/delete enforcement</li>
			</ul>
		</section>
	);
}
