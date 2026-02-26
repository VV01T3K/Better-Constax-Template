import { createRouter } from "@tanstack/react-router";

import { Route as RootRoute } from "./routes/__root";
import { Route as AuthApiRoute } from "./routes/api/auth/$.ts";
import { Route as SignInRoute } from "./routes/auth/sign-in";
import { Route as SignOutRoute } from "./routes/auth/sign-out";
import { Route as SignUpRoute } from "./routes/auth/sign-up";
import { Route as AddressRoute } from "./routes/demo/address";
import { Route as FilesRoute } from "./routes/demo/files";
import { Route as TodosRoute } from "./routes/demo/todos";
import { Route as IndexRoute } from "./routes/index";

const routeTree = RootRoute.addChildren([
	IndexRoute,
	TodosRoute,
	FilesRoute,
	AddressRoute,
	SignInRoute,
	SignUpRoute,
	SignOutRoute,
	AuthApiRoute,
]);

export function getRouter() {
	return createRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreload: "intent",
	});
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
