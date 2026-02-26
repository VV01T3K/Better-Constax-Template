import { createFileRoute } from "@tanstack/react-router";

function getConvexSiteUrl() {
	const fromRuntime = process.env.VITE_CONVEX_SITE_URL;
	if (!fromRuntime) {
		throw new Error("Missing VITE_CONVEX_SITE_URL for auth route proxy.");
	}
	return fromRuntime;
}

async function proxyAuthRequest(request: Request) {
	const incomingUrl = new URL(request.url);
	const authPathIndex = incomingUrl.pathname.indexOf("/api/auth/");
	const authPath = authPathIndex >= 0 ? incomingUrl.pathname.slice(authPathIndex) : "/api/auth";
	const targetUrl = new URL(`${authPath}${incomingUrl.search}`, getConvexSiteUrl());

	const method = request.method.toUpperCase();
	const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

	const response = await fetch(targetUrl, {
		method,
		headers: request.headers,
		body,
		redirect: "manual",
	});

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers,
	});
}

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: ({ request }) => proxyAuthRequest(request),
			POST: ({ request }) => proxyAuthRequest(request),
			PUT: ({ request }) => proxyAuthRequest(request),
			PATCH: ({ request }) => proxyAuthRequest(request),
			DELETE: ({ request }) => proxyAuthRequest(request),
		},
	},
});
