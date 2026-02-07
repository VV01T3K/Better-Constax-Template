import { type HonoWithConvex, HttpRouterWithHono } from "convex-helpers/server/hono";
import { Hono } from "hono";
import { cors } from "hono/cors";

import type { ActionCtx } from "./_generated/server";

import { createAuth } from "./auth";

const app: HonoWithConvex<ActionCtx> = new Hono();

// CORS for direct client-to-Convex auth calls
app.use(
	"/api/auth/*",
	cors({
		origin: process.env.SITE_URL ?? "http://localhost:3000",
		allowHeaders: ["Content-Type", "Authorization", "Better-Auth-Cookie"],
		allowMethods: ["GET", "POST", "OPTIONS"],
		exposeHeaders: ["Content-Length", "Set-Better-Auth-Cookie"],
		maxAge: 600,
		credentials: true,
	}),
);

// Suppress Chrome DevTools warning
app.get("/.well-known/appspecific/com.chrome.devtools.json", (c) => {
	return c.json({ workspace: { root: "", uuid: "" } }, 404);
});

// Redirect root well-known to auth well-known endpoint
app.get("/.well-known/openid-configuration", async (c) => {
	return c.redirect("/api/auth/convex/.well-known/openid-configuration");
});

// Handle all Better Auth routes
app.on(["POST", "GET"], "/api/auth/*", async (c) => {
	const auth = createAuth(c.env);
	return auth.handler(c.req.raw);
});

export default new HttpRouterWithHono(app);
