import { createFileRoute } from "@tanstack/react-router";

import { authHandler } from "../../../integrations/convex/server-caller";

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: ({ request }) => authHandler(request),
			POST: ({ request }) => authHandler(request),
		},
	},
});
