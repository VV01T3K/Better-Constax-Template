import { createCRPCContext } from "better-convex/react";

import { env } from "@/env";
import { api } from "@convex/_generated/api";
import { meta } from "@convex/shared/meta";

export const { CRPCProvider, useCRPC, useCRPCClient } = createCRPCContext<typeof api>({
	api,
	meta,
	convexSiteUrl: env.VITE_CONVEX_SITE_URL,
});
