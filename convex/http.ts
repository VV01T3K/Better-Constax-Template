import { Hono } from "hono";
import {
	type HonoWithConvex,
	HttpRouterWithHono,
} from "convex-helpers/server/hono";
import type { ActionCtx } from "./_generated/server";
import { createAuth } from "./auth";

const app: HonoWithConvex<ActionCtx> = new Hono();

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
