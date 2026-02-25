import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/forbidden")({
	component: ForbiddenPage,
});

function ForbiddenPage() {
	return (
		<main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
			<h1 className="text-4xl font-bold text-foreground">403</h1>
			<p className="text-lg text-muted-foreground">
				You do not have permission to access this page.
			</p>
			<Button asChild>
				<Link to="/">Go Home</Link>
			</Button>
		</main>
	);
}
