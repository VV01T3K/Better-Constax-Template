import { Card, CardContent } from "@repo/ui/components/card";
import { Item, ItemContent, ItemTitle } from "@repo/ui/components/item";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/demo/tanstack-query")({
	component: TanStackQueryDemo,
});

function TanStackQueryDemo() {
	const { data } = useQuery({
		queryKey: ["demo-users"],
		queryFn: () =>
			Promise.resolve([
				{ id: 1, name: "Alice" },
				{ id: 2, name: "Bob" },
				{ id: 3, name: "Charlie" },
			]),
		initialData: [],
	});

	return (
		<div className="bg-background flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-2xl">
				<CardContent className="flex flex-col gap-4">
					<h1 className="text-2xl font-medium">TanStack Query Simple Promise Handling</h1>
					<div className="flex flex-col gap-2">
						{data.map((todo) => (
							<Item key={todo.id} variant="outline">
								<ItemContent>
									<ItemTitle>{todo.name}</ItemTitle>
								</ItemContent>
							</Item>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
