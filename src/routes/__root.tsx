import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import Header from "@/components/Header";
import { getCurrentUser } from "@/functions/getCurrentUser";
import { getSessionToken } from "@/functions/getSessionToken";
import { authClient } from "@/lib/auth-client";

import appCss from "../styles.css?url";

interface RootRouterContext {
	queryClient: QueryClient;
	convexQueryClient: ConvexQueryClient;
}

export const Route = createRootRouteWithContext<RootRouterContext>()({
	head: () => ({
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
				content: "#000000",
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
			{
				rel: "manifest",
				href: "/manifest.webmanifest",
			},
			{
				rel: "apple-touch-icon",
				href: "/logo192.png",
			},
		],
		scripts: [
			{
				src: "/registerSW.js",
			},
		],
	}),
	beforeLoad: async (ctx) => {
		const token = await getSessionToken();
		if (token) {
			ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
		}

		const currentUser = token ? await getCurrentUser() : null;
		return {
			token,
			currentUser,
			isAuthenticated: Boolean(token && currentUser),
		};
	},
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	shellComponent: RootDocument,
});

function RootComponent() {
	const { convexQueryClient, token } = Route.useRouteContext();

	return (
		<ConvexBetterAuthProvider
			client={convexQueryClient.convexClient}
			authClient={authClient}
			initialToken={token}
		>
			<Header />
			<main className="min-h-[calc(100vh-72px)]">
				<Outlet />
			</main>
			<TanStackDevtools
				config={{
					position: "bottom-right",
				}}
				plugins={[
					{
						name: "Tanstack Router",
						render: <TanStackRouterDevtoolsPanel />,
					},
					{
						name: "Tanstack Query",
						render: <ReactQueryDevtoolsPanel />,
					},
				]}
			/>
		</ConvexBetterAuthProvider>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
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

function NotFoundComponent() {
	return (
		<main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-3 px-6 text-center">
			<h1 className="text-3xl font-semibold">Page not found</h1>
			<p className="text-sm text-neutral-600">The route you tried to reach does not exist.</p>
		</main>
	);
}
