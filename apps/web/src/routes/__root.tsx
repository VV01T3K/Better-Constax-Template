import type { QueryClient } from "@tanstack/react-query";
import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";

import Header from "../components/Header";
import { env } from "../env";
import { ensureAuthIdentity, warmAuthIdentity } from "../integrations/convex/auth-state";
import { getConvexQueryClient } from "../integrations/convex/client";
import ConvexProvider from "../integrations/convex/provider";
import { getServerAuthState } from "../integrations/convex/server-fn";
import { RootDevtools } from "../integrations/tanstack/devtools";

import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
	token?: string | null;
}

const toOrigin = (value: string) => new URL(value).origin;
const toDnsPrefetchTarget = (origin: string) => `//${new URL(origin).host}`;

const connectionHintLinks = Array.from(
	new Set([env.VITE_CONVEX_SITE_URL, env.VITE_CONVEX_URL].map(toOrigin)),
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
			<div className="p-4 text-red-700" role="alert">
				{message}
			</div>
		);
	},
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="dark">
			<head>
				<HeadContent />
			</head>
			<body className="dark">
				<ConvexProvider>
					<Header />
					{children}
					{env.DEV ? <RootDevtools /> : null}
				</ConvexProvider>
				<Scripts />
			</body>
		</html>
	);
}
