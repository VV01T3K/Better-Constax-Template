import { useQueryClient } from "@tanstack/react-query";
import { ConvexAuthProvider } from "better-convex/auth-client";
import { ConvexReactClient, getConvexQueryClientSingleton } from "better-convex/react";

import { env } from "../../env";
import { authClient } from "./auth-client";
import { CRPCProvider } from "./crpc";

const convexClient = new ConvexReactClient(env.VITE_CONVEX_URL);

export default function AppConvexProvider({ children }: { children: React.ReactNode }) {
	const queryClient = useQueryClient();
	const convexQueryClient = getConvexQueryClientSingleton({
		convex: convexClient,
		queryClient,
	});

	return (
		<ConvexAuthProvider client={convexClient} authClient={authClient}>
			<CRPCProvider convexQueryClient={convexQueryClient} convexClient={convexClient}>
				{children}
			</CRPCProvider>
		</ConvexAuthProvider>
	);
}
