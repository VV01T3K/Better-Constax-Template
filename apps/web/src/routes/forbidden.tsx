import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/forbidden")({
	component: ForbiddenPage,
});

function ForbiddenPage() {
	return (
		<main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
			<h1 className="text-4xl font-bold text-slate-900">403</h1>
			<p className="text-lg text-slate-700">You do not have permission to access this page.</p>
			<Link
				to="/"
				className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-700"
			>
				Go Home
			</Link>
		</main>
	);
}
