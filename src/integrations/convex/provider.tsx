import { useQueryClient } from "@tanstack/react-query";
import { useRouteContext, useRouter } from "@tanstack/react-router";
import { useCallback } from "react";
import { ConvexAuthProvider } from "better-convex/auth/client";

import { authClient } from "./auth-client";
import { invalidateAuthIdentity, setSignedOutAuthIdentity } from "./auth-state";
import { convexClient, getConvexQueryClient } from "./client";
import { CRPCProvider } from "./crpc";

export default function AppConvexProvider({ children }: { children: React.ReactNode }) {
	const queryClient = useQueryClient();
	const router = useRouter();
	const { token } = useRouteContext({ from: "__root__" });
	const convexQueryClient = getConvexQueryClient(queryClient);

	const handleUnauthorized = useCallback(() => {
		void (async () => {
			await invalidateAuthIdentity(queryClient);
			await setSignedOutAuthIdentity(queryClient);
			await router.invalidate();
		})();
	}, [queryClient, router]);

	return (
		<ConvexAuthProvider
			client={convexClient}
			authClient={authClient}
			initialToken={token ?? undefined}
			onMutationUnauthorized={handleUnauthorized}
			onQueryUnauthorized={handleUnauthorized}
		>
			<CRPCProvider convexQueryClient={convexQueryClient} convexClient={convexClient}>
				{children}
			</CRPCProvider>
		</ConvexAuthProvider>
	);
}
