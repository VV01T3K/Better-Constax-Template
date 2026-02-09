import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { env } from "@/env/client";

import { routeTree } from "./routeTree.gen";

// TanStack Query DevTools global type
declare global {
	interface Window {
		__TANSTACK_QUERY_CLIENT__?: import("@tanstack/query-core").QueryClient;
	}
}

const convexUrl = env.VITE_CONVEX_URL;

export const getRouter = () => {
	const convexQueryClient = new ConvexQueryClient(convexUrl);

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				queryKeyHashFn: convexQueryClient.hashFn(),
				queryFn: convexQueryClient.queryFn(),
			},
		},
	});

	// Connect TanStack Query DevTools (dev only)
	if (typeof window !== "undefined" && import.meta.env.DEV) {
		window.__TANSTACK_QUERY_CLIENT__ = queryClient;
	}

	convexQueryClient.connect(queryClient);

	const router = createRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreload: "intent",
		context: { queryClient, convexQueryClient },
	});

	setupRouterSsrQueryIntegration({ router, queryClient });

	return router;
};

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
