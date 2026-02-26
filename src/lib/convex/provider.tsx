import type { ReactNode } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { ConvexAuthProvider } from "better-convex/auth-client";
import {
	ConvexReactClient,
	getConvexQueryClientSingleton,
	getQueryClientSingleton,
	useAuthStore,
} from "better-convex/react";

import { env } from "@/env";
import { authClient } from "@/lib/auth/client";

import { CRPCProvider } from "./crpc";
import { createQueryClient } from "./query-client";

const convex = new ConvexReactClient(env.VITE_CONVEX_URL);

function QueryProviders({ children }: { children: ReactNode }) {
	const authStore = useAuthStore();
	const queryClient = getQueryClientSingleton(createQueryClient);
	const convexQueryClient = getConvexQueryClientSingleton({ authStore, convex, queryClient });

	return (
		<QueryClientProvider client={queryClient}>
			<CRPCProvider convexClient={convex} convexQueryClient={convexQueryClient}>
				{children}
			</CRPCProvider>
		</QueryClientProvider>
	);
}

export function BetterConvexProvider({ children }: { children: ReactNode }) {
	return (
		<ConvexAuthProvider client={convex} authClient={authClient}>
			<QueryProviders>{children}</QueryProviders>
		</ConvexAuthProvider>
	);
}
