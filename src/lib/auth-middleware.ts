import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";

import { getToken } from "./auth-server";

export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
	const token = await getToken();

	if (!token) {
		const requestUrl = new URL(request.url);
		const redirectTarget = `${requestUrl.pathname}${requestUrl.search}`;
		throw redirect({ to: "/auth/login", search: { redirect: redirectTarget } });
	}

	return await next();
});
