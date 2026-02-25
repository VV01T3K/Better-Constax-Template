import type { ConvexQueryClient } from "@convex-dev/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { useInfiniteQuery, useQueryClient, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { BarChart3, Database, Rows3, Timer } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type MassiveMode = "paginated" | "infinite";

type MassiveRow = {
	id: number;
	name: string;
	region: string;
	status: "active" | "idle" | "paused" | "error";
	score: number;
	throughput: number;
	latencyMs: number;
	updatedAt: number;
};

type MassivePageResult = {
	rows: MassiveRow[];
	nextCursor: number | null;
	totalRows: number;
	hasMore: boolean;
	limit: number;
};

const DEFAULT_PAGE_SIZE = 200;
const PAGE_SIZE_OPTIONS = [50, 100, 200, 500, 1000, 2000] as const;
const VIRTUAL_ROW_HEIGHT = 52;
const MIN_PREFETCH_AHEAD_ROWS = 50;
const PREFETCH_LINEAR_SCALE = 0.3;
const MASSIVE_DATA_GRID_COLUMNS =
	"grid-cols-[minmax(80px,0.7fr)_minmax(220px,2.1fr)_minmax(90px,0.9fr)_minmax(110px,1fr)_minmax(110px,1fr)_minmax(130px,1.1fr)_minmax(110px,1fr)_minmax(130px,1.1fr)]";

export const Route = createFileRoute("/_authenticated/demo/massive-data")({
	beforeLoad: async ({ context }) => {
		const allowed = await context.queryClient.fetchQuery({
			...convexQuery(api.functions.authorization.hasPermission, {
				permission: "demo.massive-data.access",
			}),
			staleTime: 0,
		});
		if (!allowed) throw redirect({ to: "/forbidden" });
	},
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			convexQuery(api.functions.massiveDataset.page, {
				cursor: null,
				limit: DEFAULT_PAGE_SIZE,
			}),
		);
	},
	component: MassiveDataPage,
});

function MassiveDataPage() {
	const { convexQueryClient } = Route.useRouteContext();
	const [mode, setMode] = useState<MassiveMode>("infinite");

	return (
		<div className="p-6">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
				<Card>
					<CardHeader>
						<div className="flex flex-wrap items-center justify-between gap-4">
							<div>
								<CardTitle className="text-3xl">Massive Data Demo</CardTitle>
								<CardDescription className="mt-2 max-w-3xl">
									Convex-generated dataset rendered with TanStack Query in paginated and
									infinite loading modes.
								</CardDescription>
							</div>
							<div className="inline-flex rounded-lg border p-1">
								<Button
									variant={mode === "paginated" ? "default" : "ghost"}
									size="sm"
									onClick={() => setMode("paginated")}
								>
									Paginated
								</Button>
								<Button
									variant={mode === "infinite" ? "default" : "ghost"}
									size="sm"
									onClick={() => setMode("infinite")}
								>
									Infinite
								</Button>
							</div>
						</div>
					</CardHeader>
				</Card>

				{mode === "paginated" ? (
					<PaginatedDatasetView />
				) : (
					<InfiniteDatasetView convexQueryClient={convexQueryClient} />
				)}
			</div>
		</div>
	);
}

function PaginatedDatasetView() {
	const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
	const [pageIndex, setPageIndex] = useState(0);

	const cursor = pageIndex * pageSize;
	const { data, isFetching } = useQuery({
		...convexQuery(api.functions.massiveDataset.page, {
			cursor,
			limit: pageSize,
		}),
		placeholderData: (previousData) => previousData,
	});

	if (!data) {
		return (
			<Card>
				<CardContent className="p-6 text-center text-muted-foreground">
					Loading dataset...
				</CardContent>
			</Card>
		);
	}

	const totalPages = Math.max(1, Math.ceil(data.totalRows / pageSize));
	const canPrev = pageIndex > 0;
	const canNext = pageIndex + 1 < totalPages;

	return (
		<div className="flex flex-col gap-4">
			<StatsBar
				totalRows={data.totalRows}
				loadedRows={data.rows.length}
				modeLabel="Paginated"
				fetchStatus={isFetching ? "Refreshing" : "Ready"}
			/>

			<Card>
				<CardContent className="flex flex-wrap items-center gap-3 pt-6">
					<label className="text-sm text-muted-foreground" htmlFor="page-size">
						Page size
					</label>
					<select
						id="page-size"
						value={pageSize}
						onChange={(event) => {
							const nextPageSize = Number(event.target.value);
							setPageSize(nextPageSize);
							setPageIndex(0);
						}}
						className="flex h-8 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					>
						{PAGE_SIZE_OPTIONS.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>

					<div className="ml-auto flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPageIndex(0)}
							disabled={!canPrev}
						>
							First
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
							disabled={!canPrev}
						>
							Prev
						</Button>
						<span className="min-w-36 text-center text-sm text-muted-foreground">
							Page {pageIndex + 1} / {totalPages}
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								setPageIndex((prev) => Math.min(totalPages - 1, prev + 1))
							}
							disabled={!canNext}
						>
							Next
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPageIndex(() => Math.max(0, totalPages - 1))}
							disabled={!canNext}
						>
							Last
						</Button>
					</div>

					<DatasetRowsTable rows={data.rows} />
				</CardContent>
			</Card>
		</div>
	);
}

function InfiniteDatasetView({ convexQueryClient }: { convexQueryClient: ConvexQueryClient }) {
	const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
	const queryClient = useQueryClient();

	const cachedFirstPage = queryClient.getQueryData<MassivePageResult>(
		convexQuery(api.functions.massiveDataset.page, {
			cursor: null,
			limit: pageSize,
		}).queryKey,
	);

	const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } = useInfiniteQuery({
		queryKey: ["massive-dataset", "infinite", pageSize],
		initialPageParam: null as number | null,
		queryFn: async ({ pageParam }) => {
			return await convexQueryClient.convexClient.query(api.functions.massiveDataset.page, {
				cursor: pageParam,
				limit: pageSize,
			});
		},
		getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
		initialData: cachedFirstPage
			? {
					pages: [cachedFirstPage],
					pageParams: [null],
				}
			: undefined,
	});

	const rows = useMemo(() => data?.pages.flatMap((page) => page.rows) ?? [], [data]);
	const totalRows = data?.pages[0]?.totalRows ?? 0;
	const hasMore = hasNextPage ?? false;
	const effectivePageSize = data?.pages[data.pages.length - 1]?.limit ?? pageSize;
	const prefetchAheadRows = calculatePrefetchAheadRows(effectivePageSize);

	return (
		<div className="flex flex-col gap-4">
			<StatsBar
				totalRows={totalRows}
				loadedRows={rows.length}
				modeLabel="Infinite"
				fetchStatus={
					isFetchingNextPage ? "Loading next page" : isFetching ? "Refreshing" : "Ready"
				}
			/>

			<Card>
				<CardContent className="flex flex-wrap items-center gap-3 pt-6">
					<label className="text-sm text-muted-foreground" htmlFor="infinite-page-size">
						Page size
					</label>
					<select
						id="infinite-page-size"
						value={pageSize}
						onChange={(event) => setPageSize(Number(event.target.value))}
						className="flex h-8 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					>
						{PAGE_SIZE_OPTIONS.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>

					<p className="ml-auto text-sm text-muted-foreground">
						{hasMore
							? isFetchingNextPage
								? "Loading next page..."
								: "Scroll to auto-load more (virtualized)"
							: "No more rows"}
					</p>
				</CardContent>
			</Card>

			<VirtualizedDatasetRowsTable
				rows={rows}
				hasMore={hasMore}
				isFetchingNextPage={isFetchingNextPage}
				prefetchAheadRows={prefetchAheadRows}
				fetchNextPage={fetchNextPage}
			/>

			{isFetching && !isFetchingNextPage && (
				<p className="text-right text-xs text-muted-foreground">
					Refreshing already loaded pages...
				</p>
			)}
		</div>
	);
}

function StatsBar({
	totalRows,
	loadedRows,
	modeLabel,
	fetchStatus,
}: {
	totalRows: number;
	loadedRows: number;
	modeLabel: string;
	fetchStatus: string;
}) {
	const cards = [
		{ icon: Database, label: "Total", value: formatInt(totalRows) },
		{ icon: Rows3, label: "Loaded", value: formatInt(loadedRows) },
		{ icon: BarChart3, label: "Mode", value: modeLabel },
		{ icon: Timer, label: "Fetch", value: fetchStatus },
	] as const;

	return (
		<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
			{cards.map((card) => (
				<Card key={card.label}>
					<CardContent className="p-4">
						<div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
							<card.icon className="size-3.5" />
							{card.label}
						</div>
						<div className="text-lg font-semibold">{card.value}</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

function DatasetRowsTable({ rows }: { rows: MassiveRow[] }) {
	return (
		<div className="w-full overflow-hidden rounded-lg border">
			<div
				className={`grid ${MASSIVE_DATA_GRID_COLUMNS} border-b bg-muted/50 px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground`}
			>
				<span>ID</span>
				<span>Name</span>
				<span>Region</span>
				<span>Status</span>
				<span>Score</span>
				<span>Throughput</span>
				<span>Latency</span>
				<span>Updated</span>
			</div>
			<div className="h-140 overflow-auto">
				{rows.map((row) => (
					<div
						key={row.id}
						className={`grid w-full ${MASSIVE_DATA_GRID_COLUMNS} items-center border-b px-4 py-3 text-sm`}
					>
						<span className="font-mono text-xs text-muted-foreground">{row.id}</span>
						<span className="truncate">{row.name}</span>
						<span>{row.region}</span>
						<StatusBadge status={row.status} />
						<span>{formatInt(row.score)}</span>
						<span>{formatInt(row.throughput)}</span>
						<span>{row.latencyMs}ms</span>
						<span className="text-xs text-muted-foreground">
							{formatTime(row.updatedAt)}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

function VirtualizedDatasetRowsTable({
	rows,
	hasMore,
	isFetchingNextPage,
	prefetchAheadRows,
	fetchNextPage,
}: {
	rows: MassiveRow[];
	hasMore: boolean;
	isFetchingNextPage: boolean;
	prefetchAheadRows: number;
	fetchNextPage: () => Promise<unknown>;
}) {
	const scrollRef = useRef<HTMLDivElement>(null);

	const rowVirtualizer = useVirtualizer({
		count: hasMore ? rows.length + 1 : rows.length,
		getItemKey: (index) => rows[index]?.id ?? "loader-row",
		getScrollElement: () => scrollRef.current,
		estimateSize: () => VIRTUAL_ROW_HEIGHT,
		overscan: 10,
	});

	const virtualItems = rowVirtualizer.getVirtualItems();

	useEffect(() => {
		if (rows.length === 0) return;

		const lastItem = virtualItems[virtualItems.length - 1];
		if (!lastItem) return;

		const prefetchIndex = Math.max(0, rows.length - prefetchAheadRows);
		if (lastItem.index >= prefetchIndex && hasMore && !isFetchingNextPage) {
			void fetchNextPage();
		}
	}, [fetchNextPage, hasMore, isFetchingNextPage, prefetchAheadRows, rows.length, virtualItems]);

	return (
		<div className="overflow-hidden rounded-lg border">
			<div
				className={`grid ${MASSIVE_DATA_GRID_COLUMNS} border-b bg-muted/50 px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground`}
			>
				<span>ID</span>
				<span>Name</span>
				<span>Region</span>
				<span>Status</span>
				<span>Score</span>
				<span>Throughput</span>
				<span>Latency</span>
				<span>Updated</span>
			</div>

			<div ref={scrollRef} className="h-140 overflow-auto [overflow-anchor:none]">
				<div
					className="relative w-full"
					style={{
						height: `${rowVirtualizer.getTotalSize()}px`,
					}}
				>
					{virtualItems.map((virtualRow) => {
						const isLoaderRow = virtualRow.index > rows.length - 1;
						const row = rows[virtualRow.index];

						return (
							<div
								key={virtualRow.key}
								className={`grid w-full ${MASSIVE_DATA_GRID_COLUMNS} items-center border-b px-4 py-3 text-sm`}
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									width: "100%",
									height: `${virtualRow.size}px`,
									transform: `translateY(${virtualRow.start}px)`,
								}}
							>
								{isLoaderRow || !row ? (
									<span className="col-span-8 text-center text-xs text-muted-foreground">
										{hasMore ? "Loading more rows..." : "All rows loaded"}
									</span>
								) : (
									<>
										<span className="font-mono text-xs text-muted-foreground">
											{row.id}
										</span>
										<span className="truncate">{row.name}</span>
										<span>{row.region}</span>
										<StatusBadge status={row.status} />
										<span>{formatInt(row.score)}</span>
										<span>{formatInt(row.throughput)}</span>
										<span>{row.latencyMs}ms</span>
										<span className="text-xs text-muted-foreground">
											{formatTime(row.updatedAt)}
										</span>
									</>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

function StatusBadge({ status }: { status: MassiveRow["status"] }) {
	const variant =
		status === "active"
			? "default"
			: status === "error"
				? "destructive"
				: "secondary";

	return <Badge variant={variant}>{status}</Badge>;
}

function formatInt(value: number) {
	return new Intl.NumberFormat("en-US").format(value);
}

function formatTime(timestamp: number) {
	return new Date(timestamp).toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	});
}

function calculatePrefetchAheadRows(pageSize: number) {
	const safePageSize = Math.max(1, pageSize);
	return Math.max(MIN_PREFETCH_AHEAD_ROWS, Math.ceil(safePageSize * PREFETCH_LINEAR_SCALE));
}
