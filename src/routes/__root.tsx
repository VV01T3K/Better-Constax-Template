import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import Header from "../components/Header";
import { env } from "../env";
import { getConvexQueryClient } from "../integrations/convex/client";
import ConvexProvider from "../integrations/convex/provider";
import { getServerAuthState } from "../integrations/convex/server-fn";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";

import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
	isAuthenticated?: boolean;
	token?: string | null;
}

const toOrigin = (value: string) => new URL(value).origin;
const toDnsPrefetchTarget = (origin: string) => `//${new URL(origin).host}`;

const connectionHintLinks = Array.from(
	new Set([env.VITE_SITE_URL, env.VITE_CONVEX_SITE_URL, env.VITE_CONVEX_URL].map(toOrigin)),
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
			...connectionHintLinks,
		],
	}),
	beforeLoad: async ({ context }) => {
		if (!import.meta.env.SSR) {
			return {};
		}

		const authState = await getServerAuthState();

		if (authState.token) {
			getConvexQueryClient(context.queryClient).serverHttpClient?.setAuth(authState.token);
		}

		return authState;
	},
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<ConvexProvider>
					<Header />
					{children}
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
				</ConvexProvider>
				<Scripts />
			</body>
		</html>
	);
}
