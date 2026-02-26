import { createServerFn } from "@tanstack/react-start";

import { createContext } from "./server-caller";

const createCallerContext = async () => {
	const { getRequestHeaders } = await import("@tanstack/react-start/server");

	return createContext({
		headers: new Headers(getRequestHeaders()),
	});
};

export const getServerAuthState = createServerFn({ method: "GET" }).handler(async () => {
	const ctx = await createCallerContext();

	return {
		isAuthenticated: ctx.isAuthenticated,
	};
});

export const getServerTodos = createServerFn({ method: "GET" }).handler(async () => {
	const ctx = await createCallerContext();

	if (!ctx.isAuthenticated) {
		return [];
	}

	const todos = await ctx.caller.todos.list({}, { skipUnauth: true });

	return todos ?? [];
});
