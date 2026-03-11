import type { PaginationDemoPageSize } from "@repo/convex/schemas/pagination-demo.constants";
import { Input } from "@repo/ui/components/input";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { startTransition, useEffect, useMemo, useState } from "react";

import {
	DatasetRowsTable,
	EmptyState,
	LoadingState,
	PageSizeSelect,
	PaginationDemoPage,
	StatsBar,
	formatInt,
} from "@/components/convex-pagination-demo.shared";
import { staticCRPC } from "@/integrations/convex/crpc";
import {
	clampPaginationPageIndex,
	getPaginationDemoTotalPages,
	normalizePageJumpValue,
	PAGINATION_DEMO_PAGE_QUERY_STALE_TIME_MS,
	type PaginationPagedSearch,
} from "@/lib/pagination-demo";

type ConvexPaginationDemoProps = {
	page: number;
	pageSize: PaginationDemoPageSize;
};

export function ConvexPaginationDemo({ page, pageSize }: ConvexPaginationDemoProps) {
	const navigate = useNavigate();
	const [pageInput, setPageInput] = useState(String(page + 1));
	const optimisticTotalPages = getPaginationDemoTotalPages(pageSize);

	const pagedQuery = useQuery({
		...staticCRPC.func.paginationDemo.listPage.staticQueryOptions({
			page,
			pageSize,
		}),
		placeholderData: keepPreviousData,
		staleTime: PAGINATION_DEMO_PAGE_QUERY_STALE_TIME_MS,
	});

	const effectiveTotalPages = pagedQuery.data?.totalPages ?? optimisticTotalPages;
	const effectivePageIndex = pagedQuery.data?.pageIndex ?? clampPaginationPageIndex(page, pageSize);

	useEffect(() => {
		setPageInput(String(effectivePageIndex + 1));
	}, [effectivePageIndex]);

	useEffect(() => {
		if (!pagedQuery.data) {
			return;
		}

		if (pagedQuery.data.pageIndex === page) {
			return;
		}

		startTransition(() => {
			void navigate({
				to: "/demo/convex-pagination",
				replace: true,
				search: (previous: PaginationPagedSearch) => ({
					page: pagedQuery.data.pageIndex,
					pageSize: previous.pageSize,
				}),
			});
		});
	}, [navigate, page, pagedQuery.data]);

	const updateSearch = (next: Partial<PaginationPagedSearch>) => {
		startTransition(() => {
			void navigate({
				to: "/demo/convex-pagination",
				search: (previous: PaginationPagedSearch) => ({
					page: next.page ?? previous.page,
					pageSize: next.pageSize ?? previous.pageSize,
				}),
			});
		});
	};

	const rows = pagedQuery.data?.page ?? [];
	const totalRows = pagedQuery.data?.totalRows ?? 0;
	const rangeStart = rows.length === 0 ? 0 : effectivePageIndex * pageSize + 1;
	const rangeEnd = effectivePageIndex * pageSize + rows.length;
	const canPrev = effectivePageIndex > 0 && !pagedQuery.isFetching;
	const canNext = effectivePageIndex + 1 < effectiveTotalPages && !pagedQuery.isFetching;
	const fetchStatus = pagedQuery.isFetching ? "Refreshing" : "Ready";
	const loadingMessage = useMemo(() => {
		if (pagedQuery.isPending) {
			return "Loading page...";
		}

		return "Refreshing page...";
	}, [pagedQuery.isPending]);

	return (
		<PaginationDemoPage
			eyebrow="Convex Pagination"
			title="Paginated Dataset"
			description="Indexed range queries over Convex data with direct page jumps, shareable URLs, and stable page-size controls."
		>
			<div className="flex flex-col gap-4">
				<StatsBar
					fetchStatus={fetchStatus}
					loadedRows={rows.length}
					modeLabel="Paged"
					totalRows={totalRows}
				/>

				<div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/80 p-4">
					<PageSizeSelect
						pageSize={pageSize}
						setPageSize={(value) => updateSearch({ page: 0, pageSize: value })}
					/>
					<div className="ml-auto flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={() => updateSearch({ page: 0 })}
							disabled={!canPrev}
							className="rounded-lg border border-slate-700 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
						>
							First
						</button>
						<button
							type="button"
							onClick={() => updateSearch({ page: Math.max(effectivePageIndex - 1, 0) })}
							disabled={!canPrev}
							className="rounded-lg border border-slate-700 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
						>
							Prev
						</button>
						<span className="min-w-32 text-center text-sm text-slate-300">
							Page {effectivePageIndex + 1} / {effectiveTotalPages}
						</span>
						<form
							className="flex items-center gap-2"
							onSubmit={(event) => {
								event.preventDefault();
								updateSearch({ page: normalizePageJumpValue(pageInput, effectiveTotalPages) });
							}}
						>
							<label className="text-sm text-slate-300" htmlFor="page-jump">
								Page
							</label>
							<Input
								id="page-jump"
								inputMode="numeric"
								max={effectiveTotalPages}
								min={1}
								value={pageInput}
								onChange={(event) => setPageInput(event.target.value)}
								className="h-9 w-20 border-slate-700 bg-slate-950 px-3 text-sm text-white"
							/>
							<button
								type="submit"
								className="rounded-lg border border-slate-700 px-3 py-2 text-sm"
							>
								Go
							</button>
						</form>
						<button
							type="button"
							onClick={() =>
								updateSearch({ page: Math.min(effectiveTotalPages - 1, effectivePageIndex + 1) })
							}
							disabled={!canNext}
							className="rounded-lg border border-slate-700 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
						>
							Next
						</button>
						<button
							type="button"
							onClick={() => updateSearch({ page: effectiveTotalPages - 1 })}
							disabled={effectivePageIndex === effectiveTotalPages - 1 || pagedQuery.isFetching}
							className="rounded-lg border border-slate-700 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
						>
							Last
						</button>
					</div>
				</div>

				<div className="text-right text-xs text-slate-400">
					Showing {rangeStart}-{rangeEnd} of {formatInt(totalRows)}
				</div>

				{pagedQuery.isPending ? (
					<LoadingState message={loadingMessage} />
				) : rows.length === 0 ? (
					<EmptyState />
				) : (
					<DatasetRowsTable rows={rows} />
				)}
			</div>
		</PaginationDemoPage>
	);
}
