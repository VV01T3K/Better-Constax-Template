import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { formDevtoolsPlugin } from "@tanstack/react-form-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import Header from "@/components/Header";
import { authClient } from "@/lib/auth-client";

import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
	convexQueryClient: ConvexQueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => {
		const pwaLinks = import.meta.env.PROD
			? [
					{
						rel: "manifest",
						href: "/manifest.webmanifest",
					},
				]
			: [];
		const pwaScripts = import.meta.env.PROD
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
				...pwaLinks,
				{
					rel: "apple-touch-icon",
					href: "/logo192.webp",
				},
			],
			scripts: pwaScripts,
		};
	},

	beforeLoad: async (ctx) => {
		// Only fetch token during SSR — on client navigations the
		// ConvexBetterAuthProvider already manages auth state.
		if (!import.meta.env.SSR) {
			return {};
		}

		const { getToken } = await import("@/lib/auth-server");
		const token = await getToken();

		if (token) {
			ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
		}

		return { token };
	},
	loader: async ({ context }) => {
		await context.queryClient.fetchQuery({
			...convexQuery(api.auth.getCurrentUser, {}),
			staleTime: 0,
		});
	},

	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	shellComponent: RootDocument,
});

function RootComponent() {
	const { convexQueryClient, token } = Route.useRouteContext();
	const showDevtools = import.meta.env.DEV;

	return (
		<ConvexBetterAuthProvider
			client={convexQueryClient.convexClient}
			authClient={authClient}
			initialToken={token}
		>
			<div className="flex min-h-svh flex-col">
				<Header />
				<div className="flex min-h-0 flex-1 flex-col">
					<Outlet />
				</div>
			</div>
			{showDevtools ? (
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
						formDevtoolsPlugin(),
					]}
				/>
			) : null}
		</ConvexBetterAuthProvider>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="dark">
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
