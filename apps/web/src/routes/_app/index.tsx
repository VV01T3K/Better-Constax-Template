import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";
import { Route as RouteIcon, Server, Shield, Sparkles, Waves, Zap } from "lucide-react";

export const Route = createFileRoute("/_app/")({ component: App });

function App() {
	const features = [
		{
			icon: <Zap size={48} className="text-primary" />,
			title: "Powerful Server Functions",
			description:
				"Write server-side code that seamlessly integrates with your client components. Type-safe, secure, and simple.",
		},
		{
			icon: <Server size={48} className="text-primary" />,
			title: "Flexible Server Side Rendering",
			description:
				"Full-document SSR, streaming, and progressive enhancement out of the box. Control exactly what renders where.",
		},
		{
			icon: <RouteIcon size={48} className="text-primary" />,
			title: "API Routes",
			description:
				"Build type-safe API endpoints alongside your application. No separate backend needed.",
		},
		{
			icon: <Shield size={48} className="text-primary" />,
			title: "Strongly Typed Everything",
			description:
				"End-to-end type safety from server to client. Catch errors before they reach production.",
		},
		{
			icon: <Waves size={48} className="text-primary" />,
			title: "Full Streaming Support",
			description:
				"Stream data from server to client progressively. Perfect for AI applications and real-time updates.",
		},
		{
			icon: <Sparkles size={48} className="text-primary" />,
			title: "Next Generation Ready",
			description:
				"Built from the ground up for modern web applications. Deploy anywhere JavaScript runs.",
		},
	];

	return (
		<div className="min-h-screen">
			<section className="relative overflow-hidden px-6 py-20 text-center">
				<div className="bg-primary/5 absolute inset-0" />
				<div className="relative mx-auto max-w-5xl">
					<div className="mb-6 flex items-center justify-center gap-6">
						<img
							src="/tanstack-circle-logo.avif"
							alt="TanStack Logo"
							className="h-24 w-24 md:h-32 md:w-32"
						/>
						<h1 className="text-foreground text-6xl font-black tracking-[-0.08em] md:text-7xl">
							<span className="text-muted-foreground">TANSTACK</span>{" "}
							<span className="text-primary">START</span>
						</h1>
					</div>
					<p className="text-muted-foreground mb-4 text-2xl font-light md:text-3xl">
						The framework for next generation AI applications
					</p>
					<p className="text-muted-foreground mx-auto mb-8 max-w-3xl text-lg">
						Full-stack framework powered by TanStack Router for React and Solid. Build modern
						applications with server functions, streaming, and type safety.
					</p>
					<div className="flex flex-col items-center gap-4">
						<a href="https://tanstack.com/start" target="_blank" rel="noopener noreferrer">
							<Button size="lg">Documentation</Button>
						</a>
						<p className="text-muted-foreground mt-2 text-sm">
							Begin your TanStack Start journey by editing{" "}
							<code className="bg-muted text-primary rounded px-2 py-1">/src/routes/index.tsx</code>
						</p>
					</div>
				</div>
			</section>

			<section className="mx-auto max-w-7xl px-6 py-16">
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{features.map((feature) => (
						<Card
							key={feature.title}
							className="hover:border-primary/50 hover:shadow-primary/10 transition-all duration-300 hover:shadow-lg"
						>
							<CardContent>
								<div className="mb-4">{feature.icon}</div>
								<h3 className="text-card-foreground mb-3 text-xl font-semibold">{feature.title}</h3>
								<p className="text-muted-foreground leading-relaxed">{feature.description}</p>
							</CardContent>
						</Card>
					))}
				</div>
			</section>
		</div>
	);
}
