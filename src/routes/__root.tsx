import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { parseAuthUserId, type AppPermission } from "@convex/schemas";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { formDevtoolsPlugin } from "@tanstack/react-form-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import {
	HeadContent,
	Link,
	Outlet,
	Scripts,
	createRootRouteWithContext,
	useRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { UserRoundCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { waitForImpersonationState } from "@/lib/impersonation-client";

import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
	convexQueryClient: ConvexQueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => {
		const pwaLinks = import.meta.env.PROD
			? [
					{
						rel: "manifest",
						href: "/manifest.webmanifest",
					},
				]
			: [];
		const pwaScripts = import.meta.env.PROD
			? [
					{
						src: "/registerSW.js",
					},
				]
			: [];

		return {
			meta: [
				{
					charSet: "utf-8",
				},
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1",
				},
				{
					name: "theme-color",
					content: "#000000",
				},
				{
					title: "TanStack Start Starter",
				},
			],
			links: [
				{
					rel: "stylesheet",
					href: appCss,
				},
				...pwaLinks,
				{
					rel: "apple-touch-icon",
					href: "/logo192.webp",
				},
			],
			scripts: pwaScripts,
		};
	},

	beforeLoad: async (ctx) => {
		if (!import.meta.env.SSR) {
			return {};
		}

		const { getToken } = await import("@/lib/auth-server");
		const token = await getToken();

		if (token) {
			ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
		}

		return { token };
	},
	loader: async ({ context }) => {
		await context.queryClient.fetchQuery({
			...convexQuery(api.auth.getCurrentUser, {}),
			staleTime: 0,
		});
	},

	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	shellComponent: RootDocument,
});

function RootComponent() {
	const { convexQueryClient, token } = Route.useRouteContext();
	const showDevtools = import.meta.env.DEV;

	return (
		<ConvexBetterAuthProvider
			client={convexQueryClient.convexClient}
			authClient={authClient}
			initialToken={token}
		>
			<AppLayout />
			{showDevtools ? (
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						{
							name: "Tanstack Query",
							render: <ReactQueryDevtoolsPanel />,
						},
						formDevtoolsPlugin(),
					]}
				/>
			) : null}
		</ConvexBetterAuthProvider>
	);
}

function AppLayout() {
	const accessQuery = convexQuery(api.functions.authorization.getMyAccess, {});
	const { data: myAccess } = useSuspenseQuery(accessQuery);
	const { data: ssrUser } = useSuspenseQuery(convexQuery(api.auth.getCurrentUser, {}));
	const {
		data: sessionData,
		isPending: isSessionPending,
		refetch: refetchSession,
	} = authClient.useSession();

	const sessionUser = sessionData?.user ?? null;
	const isLoggedIn = sessionUser ?? (isSessionPending ? ssrUser : null);
	const displayName =
		sessionUser?.name || sessionUser?.email || ssrUser?.name || ssrUser?.email || "";
	const displayEmail = sessionUser?.email || ssrUser?.email || "";

	const [impersonationError, setImpersonationError] = useState<string | null>(null);
	const queryClient = useQueryClient();
	const router = useRouter();

	const permissionSet = useMemo(() => {
		return new Set<AppPermission>(myAccess?.permissions ?? []);
	}, [myAccess?.permissions]);

	const stopAuditMutation = useMutation({
		mutationFn: useConvexMutation(api.functions.impersonationAudit.stop),
	});

	const handleSignOut = async () => {
		await queryClient.cancelQueries();
		await authClient.signOut().catch(() => undefined);
		queryClient.clear();
		await router.navigate({ to: "/auth/login", replace: true });
	};

	const handleStopImpersonation = async () => {
		setImpersonationError(null);
		await queryClient.cancelQueries();
		await router.navigate({ to: "/", replace: true });

		const targetUserIdRaw = sessionData?.user?.id ?? null;
		const result = await authClient.admin.stopImpersonating();
		if (result.error) {
			setImpersonationError(result.error.message ?? "Failed to stop impersonation");
			return;
		}

		const switched = await waitForImpersonationState({
			expectedImpersonating: false,
			refetchSession,
		});

		if (!switched) {
			window.location.assign("/");
			return;
		}

		const refreshedAccess = await queryClient
			.fetchQuery({
				...accessQuery,
				staleTime: 0,
			})
			.catch(() => null);
		const canStopAudit =
			refreshedAccess?.permissions.includes("admin.users.impersonation.mutate") ?? false;

		if (targetUserIdRaw && canStopAudit) {
			const targetUserId = parseAuthUserId(targetUserIdRaw);
			if (targetUserId.isErr()) {
				setImpersonationError(targetUserId.error.message);
			} else {
				await stopAuditMutation
					.mutateAsync({
						targetUserId: targetUserId.value,
						source: "header-stop-impersonation",
					})
					.catch(() => undefined);
			}
		}

		queryClient.clear();
		await router.invalidate();
	};

	const isImpersonating = Boolean(sessionData?.session?.impersonatedBy);

	return (
		<SidebarProvider>
			<AppSidebar
				user={isLoggedIn ? { name: displayName, email: displayEmail } : null}
				permissionSet={permissionSet}
				isLoggedIn={Boolean(isLoggedIn)}
				isImpersonating={isImpersonating}
				onSignOut={() => {
					void handleSignOut();
				}}
				onStopImpersonation={() => {
					void handleStopImpersonation();
				}}
			/>
			<SidebarInset>
				{isImpersonating ? (
					<Alert className="rounded-none border-x-0 border-t-0 border-amber-700 bg-amber-900/80 text-amber-50">
						<UserRoundCheck className="size-4 text-amber-200" />
						<AlertDescription className="flex flex-wrap items-center justify-between gap-2">
							<span>
								Impersonating{" "}
								<strong>
									{sessionData?.user?.email ?? sessionData?.user?.name ?? "user"}
								</strong>
							</span>
							<Button
								variant="secondary"
								size="sm"
								onClick={() => {
									void handleStopImpersonation();
								}}
							>
								Stop Impersonation
							</Button>
						</AlertDescription>
					</Alert>
				) : null}
				{impersonationError ? (
					<Alert variant="destructive" className="mx-4 mt-2">
						<AlertDescription>{impersonationError}</AlertDescription>
					</Alert>
				) : null}
				<header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
				</header>
				<main className="flex min-h-0 flex-1 flex-col">
					<Outlet />
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="dark">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}

function NotFoundComponent() {
	return (
		<main className="flex min-h-[60vh] items-center justify-center px-6">
			<Card className="max-w-md text-center">
				<CardContent className="space-y-4 pt-6">
					<h1 className="text-3xl font-semibold text-foreground">Page not found</h1>
					<p className="text-sm text-muted-foreground">
						The route you tried to reach does not exist.
					</p>
					<Button asChild>
						<Link to="/">Go Home</Link>
					</Button>
				</CardContent>
			</Card>
		</main>
	);
}
