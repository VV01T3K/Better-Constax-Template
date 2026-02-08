import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { getToken } from "./auth-server";

export const authMiddleware = createMiddleware().server(async ({ next }) => {
	const token = await getToken();

	if (!token) {
		throw redirect({ to: "/auth/login" });
	}

	return await next();
});
