import type { QueryClient } from "@tanstack/react-query";
import { ConvexReactClient, getConvexQueryClientSingleton } from "better-convex/react";

import { env } from "../../env";

export const convexClient = new ConvexReactClient(env.CONVEX_URL);

export const getConvexQueryClient = (queryClient: QueryClient) =>
	getConvexQueryClientSingleton({
		convex: convexClient,
		queryClient,
	});
