import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { TooltipProvider } from "@repo/ui/components/tooltip";
import { HotkeysProvider } from "@tanstack/react-hotkeys";
import type { QueryClient } from "@tanstack/react-query";
import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { ThemeProvider } from "../components/ThemeProvider";
import { ThemeToaster } from "../components/ThemeToaster";
import { env } from "../env";
import { ensureAuthIdentity, warmAuthIdentity } from "../integrations/convex/auth-state";
import { getConvexQueryClient } from "../integrations/convex/client";
import ConvexProvider from "../integrations/convex/provider";
import { getServerAuthState } from "../integrations/convex/server-fn";

import appCss from "../styles/app.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
	token?: string | null;
}

const toOrigin = (value: string) => new URL(value).origin;
const toDnsPrefetchTarget = (origin: string) => `//${new URL(origin).host}`;

const connectionHintLinks = Array.from(
	new Set([env.CONVEX_SITE_URL, env.CONVEX_URL].map(toOrigin)),
).flatMap((origin) => [
	{
		rel: "dns-prefetch" as const,
		href: toDnsPrefetchTarget(origin),
	},
	{
		rel: "preconnect" as const,
		href: origin,
		crossOrigin: "anonymous" as const,
	},
]);

const RootDevtools = import.meta.env.DEV
	? lazy(async () => {
			const module = await import("../integrations/tanstack/devtools");
			return { default: module.RootDevtools };
		})
	: null;

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => {
		const pwaLinks = !env.DEV
			? [
					{
						rel: "manifest" as const,
						href: "/manifest.webmanifest",
					},
					{
						rel: "apple-touch-icon" as const,
						href: "/logo192.webp",
					},
				]
			: [];
		const pwaScripts = !env.DEV
			? [
					{
						src: "/registerSW.js",
					},
				]
			: [];

		return {
			meta: [
				{
					charSet: "utf-8",
				},
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1",
				},
				{
					name: "theme-color",
					content: "#1f1813",
				},
				{
					title: "TanStack Start Starter",
				},
			],
			links: [
				{
					rel: "stylesheet",
					href: appCss,
				},
				...connectionHintLinks,
				...pwaLinks,
			],
			scripts: pwaScripts,
		};
	},
	beforeLoad: async ({ context }) => {
		const convexQueryClient = getConvexQueryClient(context.queryClient);

		if (!env.SSR) {
			warmAuthIdentity(context.queryClient);
			return {};
		}

		const authState = await getServerAuthState();

		if (authState.token) {
			convexQueryClient.serverHttpClient?.setAuth(authState.token);
			await ensureAuthIdentity(context.queryClient);
		}

		return { token: authState.token };
	},
	errorComponent: ({ error }) => {
		const message = error instanceof Error ? error.message : "Unexpected route error";
		return (
			<div className="p-4">
				<Alert variant="destructive">
					<AlertDescription>{message}</AlertDescription>
				</Alert>
			</div>
		);
	},
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" data-app-theme="web" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				<ThemeProvider>
					<ConvexProvider>
						<HotkeysProvider>
							<TooltipProvider>{children}</TooltipProvider>
						</HotkeysProvider>
						<ThemeToaster />
						{RootDevtools ? (
							<Suspense fallback={null}>
								<RootDevtools />
							</Suspense>
						) : null}
					</ConvexProvider>
				</ThemeProvider>
				<Scripts />
			</body>
		</html>
	);
}
