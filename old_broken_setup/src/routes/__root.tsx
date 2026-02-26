import type { ConvexQueryClient } from "@convex-dev/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { formDevtoolsPlugin } from "@tanstack/react-form-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import {
	HeadContent,
	Link,
	Outlet,
	Scripts,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { ConvexProvider } from "convex/react";

import { AppSidebar } from "@/components/app-sidebar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
	convexQueryClient: ConvexQueryClient;
}

const PROTOTYPE_PERMISSIONS = new Set<string>([
	"demo.todos.access",
	"demo.massive-data.access",
	"demo.files.access",
	"demo.table.access",
	"demo.address-form.access",
	"admin.users.access",
	"admin.permissions.app.access",
	"admin.permissions.admin.access",
]);

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
	loader: async ({ context }) => {
		await context.queryClient.fetchQuery({
			...convexQuery(api.functions.todos.list, {}),
			staleTime: 0,
		});
	},

	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	shellComponent: RootDocument,
});

function RootComponent() {
	const { convexQueryClient } = Route.useRouteContext();
	const showDevtools = import.meta.env.DEV;

	return (
		<ConvexProvider client={convexQueryClient.convexClient}>
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
		</ConvexProvider>
	);
}

function AppLayout() {
	return (
		<SidebarProvider>
			<AppSidebar permissionSet={PROTOTYPE_PERMISSIONS} />
			<SidebarInset>
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
					<h1 className="text-foreground text-3xl font-semibold">Page not found</h1>
					<p className="text-muted-foreground text-sm">
						The route you tried to reach does not exist.
					</p>
					<Link to="/" className={buttonVariants()}>
						Go Home
					</Link>
				</CardContent>
			</Card>
		</main>
	);
}
