import { createFileRoute } from "@tanstack/react-router";

import { env } from "../../../env";
import { createContext } from "../../../integrations/convex/server-caller";

const passthroughHeaderNames = [
	"cache-control",
	"content-disposition",
	"content-length",
	"content-type",
] as const;

export const Route = createFileRoute("/api/files/$")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const ctx = await createContext({ headers: new Headers(request.headers) });
				const requestUrl = new URL(request.url);
				const fileId = requestUrl.pathname.split("/").pop();

				if (!fileId) {
					return new Response("Missing file id", { status: 400 });
				}

				const targetUrl = new URL(`/files/${encodeURIComponent(fileId)}`, env.CONVEX_SITE_URL);
				targetUrl.search = requestUrl.search;

				const response = await fetch(targetUrl, {
					headers: ctx.token
						? {
								Authorization: `Bearer ${ctx.token}`,
							}
						: undefined,
				});

				const headers = new Headers();

				for (const headerName of passthroughHeaderNames) {
					const value = response.headers.get(headerName);
					if (value) {
						headers.set(headerName, value);
					}
				}

				return new Response(response.body, {
					status: response.status,
					headers,
				});
			},
		},
	},
});
