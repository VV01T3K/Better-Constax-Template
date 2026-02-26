import { useQueryClient } from "@tanstack/react-query";
import {
	ConvexProvider,
	ConvexReactClient,
	getConvexQueryClientSingleton,
} from "better-convex/react";

import { env } from "../../env";
import { CRPCProvider } from "./crpc";

const CONVEX_URL = env.VITE_CONVEX_URL;
if (!CONVEX_URL) {
	throw new Error("Missing required env var: VITE_CONVEX_URL");
}
const convexClient = new ConvexReactClient(CONVEX_URL);

export default function AppConvexProvider({ children }: { children: React.ReactNode }) {
	const queryClient = useQueryClient();
	const convexQueryClient = getConvexQueryClientSingleton({
		convex: convexClient,
		queryClient,
	});

	return (
		<ConvexProvider client={convexClient}>
			<CRPCProvider convexQueryClient={convexQueryClient} convexClient={convexClient}>
				{children}
			</CRPCProvider>
		</ConvexProvider>
	);
}
