import { createFileRoute } from "@tanstack/react-router";
import { Route as RouteIcon, Server, Shield, Sparkles, Waves, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	const features = [
		{
			icon: <Zap className="h-10 w-10 text-primary" />,
			title: "Powerful Server Functions",
			description:
				"Write server-side code that seamlessly integrates with your client components. Type-safe, secure, and simple.",
		},
		{
			icon: <Server className="h-10 w-10 text-primary" />,
			title: "Flexible Server Side Rendering",
			description:
				"Full-document SSR, streaming, and progressive enhancement out of the box. Control exactly what renders where.",
		},
		{
			icon: <RouteIcon className="h-10 w-10 text-primary" />,
			title: "API Routes",
			description:
				"Build type-safe API endpoints alongside your application. No separate backend needed.",
		},
		{
			icon: <Shield className="h-10 w-10 text-primary" />,
			title: "Strongly Typed Everything",
			description:
				"End-to-end type safety from server to client. Catch errors before they reach production.",
		},
		{
			icon: <Waves className="h-10 w-10 text-primary" />,
			title: "Full Streaming Support",
			description:
				"Stream data from server to client progressively. Perfect for AI applications and real-time updates.",
		},
		{
			icon: <Sparkles className="h-10 w-10 text-primary" />,
			title: "Next Generation Ready",
			description:
				"Built from the ground up for modern web applications. Deploy anywhere JavaScript runs.",
		},
	];

	return (
		<div className="flex-1 p-6">
			<section className="mx-auto max-w-5xl py-12 text-center">
				<div className="mb-6 flex items-center justify-center gap-6">
					<picture>
						<source srcSet="/tanstack-circle-logo.avif" type="image/avif" />
						<img
							src="/tanstack-circle-logo.webp"
							alt="TanStack Logo"
							width={512}
							height={512}
							fetchPriority="high"
							decoding="async"
							className="h-20 w-20 md:h-28 md:w-28"
						/>
					</picture>
					<h1 className="text-5xl font-black tracking-[-0.06em] md:text-6xl">
						<span className="text-muted-foreground">TANSTACK</span>{" "}
						<span className="text-primary">START</span>
					</h1>
				</div>
				<p className="mb-3 text-xl font-light text-muted-foreground md:text-2xl">
					The framework for next generation AI applications
				</p>
				<p className="mx-auto mb-8 max-w-3xl text-sm text-muted-foreground">
					Full-stack framework powered by TanStack Router for React and Solid. Build modern
					applications with server functions, streaming, and type safety.
				</p>
				<div className="flex flex-col items-center gap-4">
					<Button asChild size="lg">
						<a href="https://tanstack.com/start" target="_blank" rel="noopener noreferrer">
							Documentation
						</a>
					</Button>
					<p className="mt-2 text-sm text-muted-foreground">
						Begin your TanStack Start journey by editing{" "}
						<Badge variant="secondary">/src/routes/index.tsx</Badge>
					</p>
				</div>
			</section>

			<section className="mx-auto max-w-7xl py-8">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{features.map((feature) => (
						<Card
							key={feature.title}
							className="transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
						>
							<CardHeader>
								<div className="mb-2">{feature.icon}</div>
								<CardTitle>{feature.title}</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-sm leading-relaxed">
									{feature.description}
								</CardDescription>
							</CardContent>
						</Card>
					))}
				</div>
			</section>
		</div>
	);
}
