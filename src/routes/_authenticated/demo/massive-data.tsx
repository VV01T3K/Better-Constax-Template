import type { ConvexQueryClient } from "@convex-dev/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { useInfiniteQuery, useQueryClient, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { BarChart3, Database, Rows3, Timer } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

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
		<div className="min-h-screen bg-radial from-slate-900 via-slate-950 to-black p-6 text-white">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
				<div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6 shadow-xl">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div>
							<h1 className="text-3xl font-bold tracking-tight">Massive Data Demo</h1>
							<p className="mt-2 max-w-3xl text-sm text-slate-300">
								Convex-generated dataset rendered with TanStack Query in paginated and infinite
								loading modes.
							</p>
						</div>
						<div className="inline-flex rounded-xl border border-slate-700 bg-slate-950 p-1">
							<ModeButton active={mode === "paginated"} onClick={() => setMode("paginated")}>
								Paginated
							</ModeButton>
							<ModeButton active={mode === "infinite"} onClick={() => setMode("infinite")}>
								Infinite
							</ModeButton>
						</div>
					</div>
				</div>

				{mode === "paginated" ? (
					<PaginatedDatasetView />
				) : (
					<InfiniteDatasetView convexQueryClient={convexQueryClient} />
				)}
			</div>
		</div>
	);
}

function ModeButton({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
				active ? "bg-cyan-500 text-white" : "text-slate-300 hover:bg-slate-800"
			}`}
		>
			{children}
		</button>
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
			<div className="rounded-xl border border-slate-700 bg-slate-900/80 p-6 text-center text-slate-300">
				Loading dataset...
			</div>
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

			<div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/80 p-4">
				<label className="text-sm text-slate-300" htmlFor="page-size">
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
					className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
				>
					{PAGE_SIZE_OPTIONS.map((option) => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
				</select>

				<div className="ml-auto flex items-center gap-2">
					<button
						type="button"
						onClick={() => setPageIndex(0)}
						disabled={!canPrev}
						className="rounded-lg border border-slate-700 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
					>
						First
					</button>
					<button
						type="button"
						onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
						disabled={!canPrev}
						className="rounded-lg border border-slate-700 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
					>
						Prev
					</button>
					<span className="min-w-36 text-center text-sm text-slate-300">
						Page {pageIndex + 1} / {totalPages}
					</span>
					<button
						type="button"
						onClick={() => setPageIndex((prev) => Math.min(totalPages - 1, prev + 1))}
						disabled={!canNext}
						className="rounded-lg border border-slate-700 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
					>
						Next
					</button>
					<button
						type="button"
						onClick={() => setPageIndex(() => Math.max(0, totalPages - 1))}
						disabled={!canNext}
						className="rounded-lg border border-slate-700 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
					>
						Last
					</button>
				</div>

				<DatasetRowsTable rows={data.rows} />
			</div>
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
				fetchStatus={isFetchingNextPage ? "Loading next page" : isFetching ? "Refreshing" : "Ready"}
			/>

			<div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/80 p-4">
				<label className="text-sm text-slate-300" htmlFor="infinite-page-size">
					Page size
				</label>
				<select
					id="infinite-page-size"
					value={pageSize}
					onChange={(event) => setPageSize(Number(event.target.value))}
					className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
				>
					{PAGE_SIZE_OPTIONS.map((option) => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
				</select>

				<p className="ml-auto text-sm text-slate-300">
					{hasMore
						? isFetchingNextPage
							? "Loading next page..."
							: "Scroll to auto-load more (virtualized)"
						: "No more rows"}
				</p>
			</div>

			<VirtualizedDatasetRowsTable
				rows={rows}
				hasMore={hasMore}
				isFetchingNextPage={isFetchingNextPage}
				prefetchAheadRows={prefetchAheadRows}
				fetchNextPage={fetchNextPage}
			/>

			{isFetching && !isFetchingNextPage && (
				<p className="text-right text-xs text-slate-400">Refreshing already loaded pages...</p>
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
		{
			icon: Database,
			label: "Total",
			value: formatInt(totalRows),
		},
		{
			icon: Rows3,
			label: "Loaded",
			value: formatInt(loadedRows),
		},
		{
			icon: BarChart3,
			label: "Mode",
			value: modeLabel,
		},
		{
			icon: Timer,
			label: "Fetch",
			value: fetchStatus,
		},
	] as const;

	return (
		<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
			{cards.map((card) => (
				<div key={card.label} className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
					<div className="mb-1 flex items-center gap-2 text-xs tracking-wide text-slate-400 uppercase">
						<card.icon size={14} />
						{card.label}
					</div>
					<div className="text-lg font-semibold">{card.value}</div>
				</div>
			))}
		</div>
	);
}

function DatasetRowsTable({ rows }: { rows: MassiveRow[] }) {
	return (
		<div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900/80">
			<div
				className={`grid ${MASSIVE_DATA_GRID_COLUMNS} border-b border-slate-700 bg-slate-950/90 px-4 py-3 text-xs tracking-wide text-slate-400 uppercase`}
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
						className={`grid w-full ${MASSIVE_DATA_GRID_COLUMNS} items-center border-b border-slate-800 px-4 py-3 text-sm text-slate-100`}
					>
						<span className="font-mono text-xs text-slate-300">{row.id}</span>
						<span className="truncate">{row.name}</span>
						<span>{row.region}</span>
						<span className={statusClassName(row.status)}>{row.status}</span>
						<span>{formatInt(row.score)}</span>
						<span>{formatInt(row.throughput)}</span>
						<span>{row.latencyMs}ms</span>
						<span className="text-xs text-slate-400">{formatTime(row.updatedAt)}</span>
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
		<div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900/80">
			<div
				className={`grid ${MASSIVE_DATA_GRID_COLUMNS} border-b border-slate-700 bg-slate-950/90 px-4 py-3 text-xs tracking-wide text-slate-400 uppercase`}
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
								className={`grid w-full ${MASSIVE_DATA_GRID_COLUMNS} items-center border-b border-slate-800 px-4 py-3 text-sm text-slate-100`}
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
									<span className="col-span-8 text-center text-xs text-slate-400">
										{hasMore ? "Loading more rows..." : "All rows loaded"}
									</span>
								) : (
									<>
										<span className="font-mono text-xs text-slate-300">{row.id}</span>
										<span className="truncate">{row.name}</span>
										<span>{row.region}</span>
										<span className={statusClassName(row.status)}>{row.status}</span>
										<span>{formatInt(row.score)}</span>
										<span>{formatInt(row.throughput)}</span>
										<span>{row.latencyMs}ms</span>
										<span className="text-xs text-slate-400">{formatTime(row.updatedAt)}</span>
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

function statusClassName(status: MassiveRow["status"]) {
	if (status === "active") return "text-emerald-300";
	if (status === "paused") return "text-amber-300";
	if (status === "error") return "text-rose-300";
	return "text-slate-300";
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
