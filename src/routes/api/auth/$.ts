import { createFileRoute } from "@tanstack/react-router";

import { handler } from "@/lib/auth-server";

function preserveSetCookieHeaders(response: Response) {
	const headersWithSetCookie = response.headers as Headers & {
		getSetCookie?: () => string[];
	};
	const setCookies = headersWithSetCookie.getSetCookie?.() ?? [];
	if (setCookies.length === 0) {
		return response;
	}

	const headers = new Headers(response.headers);
	headers.delete("set-cookie");
	for (const setCookie of setCookies) {
		headers.append("set-cookie", setCookie);
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const response = await handler(request);
				return preserveSetCookieHeaders(response);
			},
			POST: async ({ request }) => {
				const response = await handler(request);
				return preserveSetCookieHeaders(response);
			},
		},
	},
});
