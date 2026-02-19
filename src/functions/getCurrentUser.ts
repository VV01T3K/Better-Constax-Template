import { api } from "@convex/_generated/api";
import { createServerFn } from "@tanstack/react-start";

import { fetchAuthQuery } from "@/lib/auth-server";

export const getCurrentUser = createServerFn({ method: "GET" }).handler(async () => {
	try {
		return await fetchAuthQuery(api.auth.getCurrentUser, {});
	} catch {
		return null;
	}
});
