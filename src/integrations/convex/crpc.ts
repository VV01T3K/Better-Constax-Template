import { api } from "@convex/api";
import { meta } from "@convex/meta";
import { createCRPCContext } from "better-convex/react";

import { env } from "../../env";

export const { CRPCProvider, useCRPC, useCRPCClient } = createCRPCContext({
	api,
	meta,
	convexSiteUrl: env.VITE_CONVEX_SITE_URL,
});
