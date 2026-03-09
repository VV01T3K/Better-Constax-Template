import { createFileRoute } from "@tanstack/react-router";

import { TanStackTableDemoPage } from "@/components/tanstack-table-demo";
import { staticCRPC } from "@/integrations/convex/crpc";

export const Route = createFileRoute("/_app/demo/tanstack-table")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			staticCRPC.func.tanstackTableDemo.page.staticQueryOptions({
				filter: "",
				pageIndex: 0,
				pageSize: 10,
				sortDirection: "desc",
				sortKey: "updatedAt",
				status: "all",
			}),
		);
	},
	component: TanStackTableRoute,
});

function TanStackTableRoute() {
	return <TanStackTableDemoPage />;
}
