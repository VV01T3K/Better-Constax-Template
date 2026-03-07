/* @refresh reload */
import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter, useRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { useEffect } from "react";

import { routeTree } from "./routeTree.gen";

type AppRouter = ReturnType<typeof createTanStackRouter>;

type NotFoundLogProps = {
	routeId?: string;
	isNotFound?: boolean;
	data?: unknown;
};

const stringifyLog = (value: unknown) => {
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
};

function logNotFound(props: NotFoundLogProps, router?: AppRouter) {
	const latestLocation = router?.latestLocation;
	const matchedRouteIds = router?.state.matches?.map((match) => match.routeId ?? match.id) ?? null;

	const basePayload = {
		routeId: props.routeId ?? null,
		isNotFound: props.isNotFound ?? null,
		data: props.data ?? null,
		environment: import.meta.env.SSR ? "server" : "client",
		url:
			typeof window !== "undefined"
				? `${window.location.pathname}${window.location.search}${window.location.hash}`
				: null,
		routerLatestHref: latestLocation?.href ?? null,
		routerLatestPathname: latestLocation?.pathname ?? null,
		routerLatestSearch: latestLocation?.searchStr ?? null,
		routerLatestHash: latestLocation?.hash ?? null,
		matchedRouteIds,
	};

	// oxlint-disable-next-line eslint/no-console
	console.warn(`[router:not-found] ${stringifyLog(basePayload)}`);
}

function DefaultNotFoundComponent(props: NotFoundLogProps) {
	const router = useRouter();
	useEffect(() => {
		logNotFound(props, router);
	}, []); // oxlint-disable-line react-hooks/exhaustive-deps

	return <p>Not Found</p>;
}

export function getRouter() {
	const queryClient = new QueryClient();
	const context = { queryClient };
	const router = createTanStackRouter({
		routeTree,

		context,

		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 30_000,
		defaultNotFoundComponent: DefaultNotFoundComponent,
	}) as AppRouter;

	setupRouterSsrQueryIntegration({
		router,
		queryClient,
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: AppRouter;
	}
}
