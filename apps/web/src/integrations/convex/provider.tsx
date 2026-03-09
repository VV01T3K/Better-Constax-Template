import { useQueryClient } from "@tanstack/react-query";
import { useRouteContext, useRouter } from "@tanstack/react-router";
import { ConvexAuthProvider } from "better-convex/auth/client";
import { useCallback } from "react";

import { authClient } from "./auth-client";
import {
	getAuthRouteNavigateOptions,
	getRedirectTargetFromRouterLocation,
	isProtectedRouteMatch,
} from "./auth-redirect";
import { prepareSignedOutSession } from "./auth-state";
import { convexClient, getConvexQueryClient } from "./client";
import { CRPCProvider } from "./crpc";

export default function AppConvexProvider({ children }: { children: React.ReactNode }) {
	const queryClient = useQueryClient();
	const router = useRouter();
	const { token } = useRouteContext({ from: "__root__" });
	const convexQueryClient = getConvexQueryClient(queryClient);

	const handleUnauthorized = useCallback(() => {
		void (async () => {
			await prepareSignedOutSession(queryClient);
			await router.invalidate();

			if (!isProtectedRouteMatch(router.state.matches)) {
				return;
			}

			const redirectTarget = getRedirectTargetFromRouterLocation(router.state.location);

			await router.navigate(getAuthRouteNavigateOptions(redirectTarget));
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
