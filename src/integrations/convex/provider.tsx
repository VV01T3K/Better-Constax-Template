import { useQueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { ConvexAuthProvider } from "better-convex/auth/client";

import { authClient } from "./auth-client";
import { convexClient, getConvexQueryClient } from "./client";
import { CRPCProvider } from "./crpc";

export default function AppConvexProvider({ children }: { children: React.ReactNode }) {
	const queryClient = useQueryClient();
	const { token } = useRouteContext({ from: "__root__" });
	const convexQueryClient = getConvexQueryClient(queryClient);

	return (
		<ConvexAuthProvider
			client={convexClient}
			authClient={authClient}
			initialToken={token ?? undefined}
			onMutationUnauthorized={() => {
				// oxlint-disable-next-line eslint/no-console
				console.warn("[convex] Unauthorized mutation");
			}}
			onQueryUnauthorized={({ queryName }) => {
				// oxlint-disable-next-line eslint/no-console
				console.warn(`[convex] Unauthorized query: ${queryName}`);
			}}
		>
			<CRPCProvider convexQueryClient={convexQueryClient} convexClient={convexClient}>
				{children}
			</CRPCProvider>
		</ConvexAuthProvider>
	);
}
