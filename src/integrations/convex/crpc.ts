import { api } from "@convex/api";
import { createCRPCContext } from "better-convex/react";

import { env } from "../../env";

export const { CRPCProvider, useCRPC, useCRPCClient } = createCRPCContext({
	api,
	convexSiteUrl: env.VITE_CONVEX_SITE_URL,
});
