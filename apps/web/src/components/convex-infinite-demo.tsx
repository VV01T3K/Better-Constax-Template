import { PAGINATION_DEMO_SEED_COUNT } from "@repo/convex/schemas/pagination-demo.constants";
import { type PaginationDemoPageSize } from "@repo/convex/schemas/pagination-demo.constants";
import { useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery as useConvexInfiniteQuery } from "better-convex/react";
import { startTransition, useEffect, useRef } from "react";

import {
	EmptyState,
	LoadingState,
	PageSizeSelect,
	PaginationDemoPage,
	StatsBar,
	VirtualizedDatasetRowsTable,
	calculatePrefetchAheadRows,
} from "@/components/convex-pagination-demo.shared";
import { useCRPC } from "@/integrations/convex/crpc";
import { type PaginationInfiniteSearch } from "@/lib/pagination-demo";

type ConvexInfiniteDemoProps = {
	pageSize: PaginationDemoPageSize;
};

export function ConvexInfiniteDemo({ pageSize }: ConvexInfiniteDemoProps) {
	const c = useCRPC();
	const navigate = useNavigate();
	const scrollRef = useRef<HTMLDivElement>(null);
	const infiniteQuery = useConvexInfiniteQuery(
		c.func.paginationDemo.list.infiniteQueryOptions(
			{},
			{
				enabled: true,
				limit: pageSize,
			},
		),
	);

	useEffect(() => {
		scrollRef.current?.scrollTo({ top: 0 });
	}, [pageSize]);

	const updateSearch = (next: Partial<PaginationInfiniteSearch>) => {
		startTransition(() => {
			void navigate({
				to: "/demo/convex-infinite",
				search: (previous: PaginationInfiniteSearch) => ({
					pageSize: next.pageSize ?? previous.pageSize,
				}),
			});
		});
	};

	const rows = infiniteQuery.data ?? [];
	const prefetchAheadRows = calculatePrefetchAheadRows(pageSize);
	const fetchStatus = infiniteQuery.isFetchingNextPage
		? "Loading next page"
		: infiniteQuery.isFetching
			? "Refreshing"
			: "Ready";

	return (
		<PaginationDemoPage
			eyebrow="Convex Infinite Queries"
			title="Infinite Dataset"
			description="Dedicated Better Convex infinite-query flow with virtualized rendering, scroll-triggered fetching, and shareable page-size state."
		>
			<div className="flex flex-col gap-4">
				<StatsBar
					fetchStatus={fetchStatus}
					loadedRows={rows.length}
					modeLabel="Infinite"
					totalRows={PAGINATION_DEMO_SEED_COUNT}
				/>

				<div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/80 p-4">
					<PageSizeSelect
						pageSize={pageSize}
						setPageSize={(value) => updateSearch({ pageSize: value })}
					/>
					<p className="ml-auto text-sm text-slate-300">
						{infiniteQuery.hasNextPage
							? infiniteQuery.isFetchingNextPage
								? "Loading next page..."
								: "Scroll to auto-load more (virtualized)"
							: "All rows loaded"}
					</p>
				</div>

				{infiniteQuery.status === "LoadingFirstPage" ? (
					<LoadingState message="Loading persisted rows..." />
				) : rows.length === 0 ? (
					<EmptyState />
				) : (
					<VirtualizedDatasetRowsTable
						fetchNextPage={infiniteQuery.fetchNextPage}
						hasMore={infiniteQuery.hasNextPage}
						isFetchingNextPage={infiniteQuery.isFetchingNextPage}
						prefetchAheadRows={prefetchAheadRows}
						rows={rows}
						scrollRef={scrollRef}
					/>
				)}

				{infiniteQuery.isFetching && !infiniteQuery.isFetchingNextPage ? (
					<p className="text-right text-xs text-slate-400">Refreshing already loaded pages...</p>
				) : null}
			</div>
		</PaginationDemoPage>
	);
}
