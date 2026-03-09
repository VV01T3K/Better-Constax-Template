import { Separator } from "@repo/ui/components/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@repo/ui/components/sidebar";
import { TooltipProvider } from "@repo/ui/components/tooltip";
import type { QueryClient } from "@tanstack/react-query";
import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";

import { AppSidebar } from "../components/AppSidebar";
import { env } from "../env";
import { ensureAuthIdentity, warmAuthIdentity } from "../integrations/convex/auth-state";
import { getConvexQueryClient } from "../integrations/convex/client";
import ConvexProvider from "../integrations/convex/provider";
import { getServerAuthState } from "../integrations/convex/server-fn";
import { RootDevtools } from "../integrations/tanstack/devtools";

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
						href: "/logo192.png",
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
			<div className="text-destructive p-4" role="alert">
				{message}
			</div>
		);
	},
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="dark" data-app-theme="web">
			<head>
				<HeadContent />
			</head>
			<body className="dark">
				<ConvexProvider>
					<TooltipProvider>
						<SidebarProvider>
							<AppSidebar />
							<SidebarInset>
								<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
									<div className="flex items-center gap-2 px-4">
										<SidebarTrigger className="-ml-1" />
										<Separator
											orientation="vertical"
											className="mr-2 data-[orientation=vertical]:h-4"
										/>
									</div>
								</header>
								<div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
							</SidebarInset>
						</SidebarProvider>
					</TooltipProvider>
					{env.DEV ? <RootDevtools /> : null}
				</ConvexProvider>
				<Scripts />
			</body>
		</html>
	);
}
