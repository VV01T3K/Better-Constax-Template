import { createFileRoute } from "@tanstack/react-router";

import { ConvexPaginationDemo } from "@/components/convex-pagination-demo";
import { staticCRPC } from "@/integrations/convex/crpc";
import {
	normalizePagedPaginationSearch,
	PAGINATION_DEMO_PAGE_QUERY_STALE_TIME_MS,
} from "@/lib/pagination-demo";

export const Route = createFileRoute("/_app/_authenticated/demo/convex-pagination")({
	validateSearch: normalizePagedPaginationSearch,
	shouldReload: false,
	loader: async ({ context, location }) => {
		const search = normalizePagedPaginationSearch(location.search);

		await context.queryClient.ensureQueryData({
			...staticCRPC.func.paginationDemo.listPage.staticQueryOptions({
				page: search.page,
				pageSize: search.pageSize,
			}),
			staleTime: PAGINATION_DEMO_PAGE_QUERY_STALE_TIME_MS,
		});
	},
	component: ConvexPaginationRoute,
});

function ConvexPaginationRoute() {
	const { page, pageSize } = Route.useSearch();

	return <ConvexPaginationDemo page={page} pageSize={pageSize} />;
}
