import { registerRoutes } from "better-convex/auth/http";
import { httpRouter } from "convex/server";

import { getAuth } from "./generated/auth";

const http = httpRouter();
// oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const getHttpAuth = getAuth as unknown as Parameters<typeof registerRoutes>[1];

registerRoutes(http, getHttpAuth, {
	cors: {
		allowedOrigins: [process.env.SITE_URL ?? "http://localhost:3000"],
	},
});

export default http;
