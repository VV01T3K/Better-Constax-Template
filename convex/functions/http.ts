import "../lib/http-polyfills";
import { authMiddleware } from "better-convex/auth";
import { HttpRouterWithHono } from "better-convex/server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { getAuth } from "./auth";

const app = new Hono();

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

// CORS for direct client-to-Convex auth calls
app.use(
	"/api/*",
	cors({
		origin: SITE_URL,
		allowHeaders: ["Content-Type", "Authorization", "Better-Auth-Cookie"],
		allowMethods: ["GET", "POST", "OPTIONS"],
		exposeHeaders: ["Content-Length", "Set-Better-Auth-Cookie"],
		maxAge: 600,
		credentials: true,
	}),
);

// Better Auth middleware handles all /api/auth/* routes
app.use(authMiddleware(getAuth));

// Redirect root well-known to auth well-known endpoint
app.get("/.well-known/openid-configuration", async (c) => {
	return c.redirect("/api/auth/convex/.well-known/openid-configuration");
});

export default new HttpRouterWithHono(app);
