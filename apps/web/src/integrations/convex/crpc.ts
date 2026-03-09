import { api } from "@repo/convex/api";
import { createCRPCContext, createCRPCOptionsProxy } from "better-convex/react";

import { env } from "../../env";

export const { CRPCProvider, useCRPC, useCRPCClient } = createCRPCContext({
	api,
	convexSiteUrl: env.CONVEX_SITE_URL,
});

export const staticCRPC = createCRPCOptionsProxy(api, api);
