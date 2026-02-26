import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start";
import { getToken } from "@convex-dev/better-auth/utils";
import { api } from "@convex/api";
import { createCallerFactory } from "better-convex/server";

import { env } from "../../env";

process.env.NEXT_PUBLIC_CONVEX_URL ??= env.VITE_CONVEX_URL;
process.env.NEXT_PUBLIC_CONVEX_SITE_URL ??= env.VITE_CONVEX_SITE_URL;

const authBridge = convexBetterAuthReactStart({
	convexUrl: env.VITE_CONVEX_URL,
	convexSiteUrl: env.VITE_CONVEX_SITE_URL,
});

export const authHandler = authBridge.handler;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const getTokenWithJwtCache = async (siteUrl: string, headers: Headers, opts?: unknown) => {
	const resolvedOpts = isRecord(opts) ? opts : {};

	return getToken(siteUrl, headers, {
		...resolvedOpts,
		jwtCache: {
			enabled: true,
			isAuthError: () => false,
		},
	});
};

export const { createContext, createCaller } = createCallerFactory({
	api,
	convexSiteUrl: env.VITE_CONVEX_SITE_URL,
	auth: {
		getToken: getTokenWithJwtCache,
	},
});
