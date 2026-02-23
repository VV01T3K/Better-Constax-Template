import { type HonoWithConvex, HttpRouterWithHono } from "convex-helpers/server/hono";
import { Hono } from "hono";

import type { ActionCtx } from "./_generated/server";
import { createAuth } from "./auth";

const app: HonoWithConvex<ActionCtx> = new Hono();

app.get("/.well-known/openid-configuration", async (c) => {
	return c.redirect("/api/auth/convex/.well-known/openid-configuration");
});

app.on(["POST", "GET"], "/api/auth/*", async (c) => {
	const auth = createAuth(c.env);
	return auth.handler(c.req.raw);
});

export default new HttpRouterWithHono(app);
