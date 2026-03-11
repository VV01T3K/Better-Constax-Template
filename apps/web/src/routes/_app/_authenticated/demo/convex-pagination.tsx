import { PAGINATION_DEMO_PAGE_SIZE } from "@repo/convex/schemas/pagination-demo";
import { createFileRoute } from "@tanstack/react-router";

import { ConvexPaginationDemo } from "@/components/convex-pagination-demo";
import { staticCRPC } from "@/integrations/convex/crpc";

type PaginationSearch = {
	mode: "paged" | "infinite";
};

const toMode = (value: unknown): PaginationSearch["mode"] =>
	value === "infinite" ? "infinite" : "paged";

export const Route = createFileRoute("/_app/_authenticated/demo/convex-pagination")({
	validateSearch: (search: Record<string, unknown>): PaginationSearch => ({
		mode: toMode(search.mode),
	}),
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			staticCRPC.func.paginationDemo.list.staticQueryOptions({
				cursor: null,
				limit: PAGINATION_DEMO_PAGE_SIZE,
			}),
		);
	},
	component: ConvexPaginationRoute,
});

function ConvexPaginationRoute() {
	const { mode } = Route.useSearch();

	return <ConvexPaginationDemo mode={mode} />;
}
