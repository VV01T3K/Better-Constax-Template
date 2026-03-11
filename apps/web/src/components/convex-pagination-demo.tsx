import {
	PAGINATION_DEMO_PAGE_SIZE,
	PAGINATION_DEMO_SEED_COUNT,
	type PaginationDemoItem,
} from "@repo/convex/schemas/pagination-demo";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { ButtonGroup } from "@repo/ui/components/button-group";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemHeader,
	ItemTitle,
} from "@repo/ui/components/item";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery as useConvexInfiniteQuery } from "better-convex/react";
import { ArrowLeft, ArrowRight, LoaderCircle, Radar, Rows3 } from "lucide-react";
import { startTransition, useEffect, useRef, useState } from "react";

import { useCRPC } from "@/integrations/convex/crpc";

type PaginationMode = "paged" | "infinite";

const statusLabels: Record<PaginationDemoItem["status"], string> = {
	queued: "Queued",
	review: "Review",
	ready: "Ready",
};

const categoryLabels: Record<PaginationDemoItem["category"], string> = {
	audit: "Audit",
	filing: "Filing",
	invoice: "Invoice",
	payroll: "Payroll",
};

const updatedAtFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
});

export function ConvexPaginationDemo({ mode }: { mode: PaginationMode }) {
	const c = useCRPC();
	const navigate = useNavigate();
	const [pageIndex, setPageIndex] = useState(0);
	const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
	const infiniteSentinelRef = useRef<HTMLDivElement | null>(null);

	const currentCursor = cursorHistory[pageIndex] ?? null;

	const pagedQuery = useQuery({
		...c.func.paginationDemo.list.queryOptions(
			{
				cursor: currentCursor,
				limit: PAGINATION_DEMO_PAGE_SIZE,
			},
			{
				enabled: mode === "paged",
				placeholderData: keepPreviousData,
			},
		),
	});

	const infiniteQuery = useConvexInfiniteQuery(
		c.func.paginationDemo.list.infiniteQueryOptions(
			{},
			{
				enabled: mode === "infinite",
				limit: PAGINATION_DEMO_PAGE_SIZE,
			},
		),
	);

	useEffect(() => {
		if (!pagedQuery.data || pagedQuery.isPlaceholderData) {
			return;
		}

		if (pagedQuery.data.isDone) {
			return;
		}

		setCursorHistory((current) => {
			if (current[pageIndex + 1] === pagedQuery.data.continueCursor) {
				return current;
			}

			const next = [...current];
			next[pageIndex + 1] = pagedQuery.data.continueCursor;
			return next;
		});
	}, [pageIndex, pagedQuery.data, pagedQuery.isPlaceholderData]);

	useEffect(() => {
		if (mode !== "infinite") {
			return;
		}

		const node = infiniteSentinelRef.current;
		if (!node) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (!entry?.isIntersecting) {
					return;
				}

				if (!infiniteQuery.hasNextPage || infiniteQuery.isFetchingNextPage) {
					return;
				}

				infiniteQuery.fetchNextPage();
			},
			{
				rootMargin: "240px 0px",
			},
		);

		observer.observe(node);
		return () => observer.disconnect();
	}, [
		infiniteQuery,
		infiniteQuery.fetchNextPage,
		infiniteQuery.hasNextPage,
		infiniteQuery.isFetchingNextPage,
		mode,
	]);

	const setMode = (nextMode: PaginationMode) => {
		startTransition(() => {
			void navigate({
				to: "/demo/convex-pagination",
				search: { mode: nextMode },
			});
		});
	};

	const pagedRows = pagedQuery.data?.page ?? [];
	const infiniteRows = infiniteQuery.data ?? [];
	const visibleRows = mode === "paged" ? pagedRows : infiniteRows;
	const loadedCount = visibleRows.length;
	const rangeStart = mode === "paged" ? pageIndex * PAGINATION_DEMO_PAGE_SIZE + 1 : 1;
	const rangeEnd =
		mode === "paged" ? pageIndex * PAGINATION_DEMO_PAGE_SIZE + pagedRows.length : loadedCount;
	const pagedPending = pagedQuery.isPending && !pagedQuery.isPlaceholderData;
	const isInitialLoading =
		mode === "paged" ? pagedPending : infiniteQuery.status === "LoadingFirstPage";

	return (
		<div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-6">
			<div className="sticky top-4 z-10">
				<Card className="border-border/80 bg-background/95 shadow-sm backdrop-blur">
					<CardHeader className="gap-3 border-b">
						<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
							<div className="space-y-1">
								<CardTitle className="flex items-center gap-2 text-base">
									<Rows3 className="size-4" />
									Convex Pagination Demo
								</CardTitle>
								<CardDescription>
									Same Convex cursor query, two client experiences: classic paging and infinite
									scroll.
								</CardDescription>
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<Badge variant="outline">{PAGINATION_DEMO_SEED_COUNT} seeded rows</Badge>
								<Badge variant="outline">{PAGINATION_DEMO_PAGE_SIZE} per request</Badge>
							</div>
						</div>
					</CardHeader>
					<CardContent className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
						<div className="flex flex-wrap items-center gap-3">
							<ButtonGroup aria-label="Pagination mode switch">
								<Button
									variant={mode === "paged" ? "default" : "outline"}
									onClick={() => setMode("paged")}
								>
									Rows Paged
								</Button>
								<Button
									variant={mode === "infinite" ? "default" : "outline"}
									onClick={() => setMode("infinite")}
								>
									<Radar className="size-4" />
									Infinite
								</Button>
							</ButtonGroup>
							<Badge variant="secondary">
								Showing {loadedCount === 0 ? 0 : rangeStart}-{rangeEnd}
							</Badge>
							<Badge variant="outline">
								{mode === "paged" ? `Page ${pageIndex + 1}` : `${loadedCount} loaded`}
							</Badge>
						</div>
						<p className="text-muted-foreground text-xs/relaxed">
							{mode === "paged"
								? "Use explicit cursor history for previous and next page navigation."
								: "Observe the same feed grow continuously while the sentinel auto-loads more."}
						</p>
					</CardContent>
				</Card>
			</div>

			<Card className="min-h-128">
				<CardContent className="flex flex-col gap-4 py-4">
					{isInitialLoading ? (
						<LoadingState />
					) : visibleRows.length === 0 ? (
						<EmptyState />
					) : (
						<ItemGroup>
							{visibleRows.map((row) => (
								<PaginationDemoRow key={row._id} row={row} />
							))}
						</ItemGroup>
					)}
				</CardContent>

				{mode === "paged" ? (
					<div className="flex items-center justify-between gap-3 border-t px-4 py-4">
						<Button
							variant="outline"
							onClick={() => setPageIndex((current) => Math.max(current - 1, 0))}
							disabled={pageIndex === 0 || pagedQuery.isFetching}
						>
							<ArrowLeft className="size-4" />
							Previous
						</Button>
						<p className="text-muted-foreground text-xs">
							{pagedQuery.isPlaceholderData || pagedQuery.isFetching
								? "Loading next slice..."
								: pagedQuery.data?.isDone
									? "Reached the final page."
									: "Cursor history is cached locally for back navigation."}
						</p>
						<Button
							variant="outline"
							onClick={() => setPageIndex((current) => current + 1)}
							disabled={pagedQuery.isPlaceholderData || pagedQuery.data?.isDone || !pagedQuery.data}
						>
							Next
							<ArrowRight className="size-4" />
						</Button>
					</div>
				) : (
					<div className="flex flex-col items-center gap-3 border-t px-4 py-4">
						<div ref={infiniteSentinelRef} className="h-1 w-full" aria-hidden />
						<Button
							variant="outline"
							onClick={() => infiniteQuery.fetchNextPage()}
							disabled={!infiniteQuery.hasNextPage || infiniteQuery.isFetchingNextPage}
						>
							{infiniteQuery.isFetchingNextPage ? (
								<>
									<LoaderCircle className="size-4 animate-spin" />
									Loading more
								</>
							) : infiniteQuery.hasNextPage ? (
								"Load more"
							) : (
								"All rows loaded"
							)}
						</Button>
						<p className="text-muted-foreground text-xs">
							{infiniteQuery.hasNextPage
								? "The sentinel also requests the next page automatically when you scroll near the bottom."
								: "Nothing else to fetch from the seeded dataset."}
						</p>
					</div>
				)}
			</Card>
		</div>
	);
}

function PaginationDemoRow({ row }: { row: PaginationDemoItem }) {
	return (
		<Item variant="outline" className="gap-3 px-3 py-3">
			<ItemHeader>
				<div className="flex items-center gap-2">
					<Badge variant="outline">#{row.position + 1}</Badge>
					<Badge variant="secondary">{categoryLabels[row.category]}</Badge>
					<Badge variant={row.status === "ready" ? "default" : "outline"}>
						{statusLabels[row.status]}
					</Badge>
				</div>
				<p className="text-muted-foreground text-xs">{updatedAtFormatter.format(row.updatedAt)}</p>
			</ItemHeader>
			<ItemContent>
				<ItemTitle className="text-sm">{row.title}</ItemTitle>
				<ItemDescription>{row.summary}</ItemDescription>
			</ItemContent>
			<ItemActions className="ml-auto">
				<Badge variant="ghost">Cursor demo</Badge>
			</ItemActions>
		</Item>
	);
}

function LoadingState() {
	return (
		<div className="text-muted-foreground flex min-h-80 flex-col items-center justify-center gap-3">
			<LoaderCircle className="size-5 animate-spin" />
			<p>Loading seeded rows...</p>
		</div>
	);
}

function EmptyState() {
	return (
		<div className="text-muted-foreground flex min-h-80 flex-col items-center justify-center gap-2 text-center">
			<p className="font-medium">No rows available.</p>
			<p className="max-w-md">
				Run the pagination demo seed mutation to populate the global dataset before opening this
				page.
			</p>
		</div>
	);
}
