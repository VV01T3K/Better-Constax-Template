import { createServerFn } from "@tanstack/react-start";

import { getServerCallerContext } from "./server-caller";

export const getServerAuthState = createServerFn({ method: "GET" }).handler(async () => {
	const ctx = await getServerCallerContext();

	return {
		isAuthenticated: ctx.isAuthenticated,
		token: ctx.token ?? null,
	};
});
