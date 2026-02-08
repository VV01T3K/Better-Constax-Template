import type { ConvexQueryClient } from "@convex-dev/react-query";
import type { QueryClient } from "@tanstack/react-query";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";

import Header from "../components/Header";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import { authClient } from "../lib/auth-client";
import { getToken } from "../lib/auth-server";
import appCss from "../styles.css?url";

const getAuth = createServerFn({ method: "GET" }).handler(async () => {
	return await getToken();
});

interface MyRouterContext {
	queryClient: QueryClient;
	convexQueryClient: ConvexQueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
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
				title: "TanStack Start Starter",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),

	beforeLoad: async (ctx) => {
		// Only fetch token during SSR — on client navigations the
		// ConvexBetterAuthProvider already manages auth state.
		if (typeof window !== "undefined") {
			return { token: undefined };
		}

		const token = await getAuth();

		if (token) {
			ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
		}

		return { token };
	},

	component: RootComponent,
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
			<Outlet />
			<TanStackDevtools
				config={{
					position: "bottom-right",
				}}
				plugins={[
					{
						name: "Tanstack Router",
						render: <TanStackRouterDevtoolsPanel />,
					},
					TanStackQueryDevtools,
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
