import { api } from "@convex/api";
import { createCRPCContext, createCRPCOptionsProxy } from "better-convex/react";

import { env } from "../../env";

export const { CRPCProvider, useCRPC, useCRPCClient } = createCRPCContext({
	api,
	convexSiteUrl: env.VITE_CONVEX_SITE_URL,
});

type StaticCRPCMeta = Parameters<typeof createCRPCOptionsProxy<typeof api>>[1];

export const staticCRPC = createCRPCOptionsProxy(api, api as unknown as StaticCRPCMeta);
