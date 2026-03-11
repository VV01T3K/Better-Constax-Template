import { createFileRoute } from "@tanstack/react-router";

import { ConvexInfiniteDemo } from "@/components/convex-infinite-demo";
import { staticCRPC } from "@/integrations/convex/crpc";
import { normalizeInfinitePaginationSearch } from "@/lib/pagination-demo";

export const Route = createFileRoute("/_app/_authenticated/demo/convex-infinite")({
	validateSearch: normalizeInfinitePaginationSearch,
	loaderDeps: ({ search }) => ({ pageSize: search.pageSize }),
	loader: async ({ context, deps }) => {
		await context.queryClient.ensureQueryData(
			staticCRPC.func.paginationDemo.list.staticQueryOptions({
				cursor: null,
				limit: deps.pageSize,
			}),
		);
	},
	component: ConvexInfiniteRoute,
});

function ConvexInfiniteRoute() {
	const { pageSize } = Route.useSearch();

	return <ConvexInfiniteDemo pageSize={pageSize} />;
}
