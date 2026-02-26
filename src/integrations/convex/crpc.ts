import { api } from "@convex/api";
import { meta } from "@convex/meta";
import { createCRPCContext } from "better-convex/react";

import { env } from "../../env";

const CONVEX_SITE_URL = env.VITE_CONVEX_SITE_URL;

if (!CONVEX_SITE_URL) {
	throw new Error("Missing required env var: VITE_CONVEX_SITE_URL");
}

export const { CRPCProvider, useCRPC, useCRPCClient } = createCRPCContext({
	api,
	meta,
	convexSiteUrl: CONVEX_SITE_URL,
});
