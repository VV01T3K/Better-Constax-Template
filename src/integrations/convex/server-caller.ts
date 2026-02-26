import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start";
import { getToken } from "@convex-dev/better-auth/utils";
import { api } from "@convex/api";
import { meta } from "@convex/meta";
import { createCallerFactory } from "better-convex/server";

import { env } from "../../env";

const authBridge = convexBetterAuthReactStart({
	convexUrl: env.VITE_CONVEX_URL,
	convexSiteUrl: env.VITE_CONVEX_SITE_URL,
});

export const authHandler = authBridge.handler;

export const { createContext, createCaller } = createCallerFactory({
	api,
	meta,
	convexSiteUrl: env.VITE_CONVEX_SITE_URL,
	auth: {
		getToken,
	},
});
