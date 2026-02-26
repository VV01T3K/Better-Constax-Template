import type { ReactNode } from "react";

import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { BetterConvexProvider } from "@/lib/convex/provider";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Better Convex + Zod" },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	component: RootComponent,
	shellComponent: RootDocument,
});

function RootComponent() {
	return (
		<BetterConvexProvider>
			<AppShell />
		</BetterConvexProvider>
	);
}

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}
