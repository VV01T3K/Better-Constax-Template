import { type PaginationDemoItem } from "@repo/convex/schemas/pagination-demo";
import {
	PAGINATION_DEMO_PAGE_SIZE_OPTIONS,
	type PaginationDemoPageSize,
} from "@repo/convex/schemas/pagination-demo.constants";
import { useVirtualizer } from "@tanstack/react-virtual";
import { BarChart3, Database, Rows3, Timer } from "lucide-react";
import { type ReactNode, type RefObject, useEffect } from "react";

import { normalizePaginationPageSize } from "@/lib/pagination-demo";

const VIRTUAL_ROW_HEIGHT = 52;
const MIN_PREFETCH_AHEAD_ROWS = 50;
const PREFETCH_LINEAR_SCALE = 0.3;
const MASSIVE_DATA_GRID_COLUMNS =
	"grid-cols-[minmax(80px,0.7fr)_minmax(220px,2.1fr)_minmax(90px,0.9fr)_minmax(110px,1fr)_minmax(110px,1fr)_minmax(130px,1.1fr)_minmax(110px,1fr)_minmax(130px,1.1fr)]";

const integerFormatter = new Intl.NumberFormat("en-US");

export function PaginationDemoPage({
	title,
	description,
	eyebrow,
	children,
}: {
	children: ReactNode;
	description: string;
	eyebrow: string;
	title: string;
}) {
	return (
		<div className="min-h-screen bg-radial from-slate-900 via-slate-950 to-black p-6 text-white">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
				<div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6 shadow-xl shadow-black/30 backdrop-blur">
					<div className="flex flex-wrap items-end justify-between gap-4">
						<div className="max-w-3xl">
							<p className="mb-2 text-xs font-semibold tracking-[0.24em] text-cyan-300 uppercase">
								{eyebrow}
							</p>
							<h1 className="text-3xl font-bold tracking-tight">{title}</h1>
							<p className="mt-2 text-sm text-slate-300">{description}</p>
						</div>
					</div>
				</div>

				{children}
			</div>
		</div>
	);
}

export function PageSizeSelect({
	pageSize,
	setPageSize,
}: {
	pageSize: PaginationDemoPageSize;
	setPageSize: (value: PaginationDemoPageSize) => void;
}) {
	return (
		<>
			<label className="text-sm text-slate-300" htmlFor="page-size">
				Page size
			</label>
			<select
				id="page-size"
				value={pageSize}
				onChange={(event) => setPageSize(normalizePaginationPageSize(event.target.value))}
				className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
			>
				{PAGINATION_DEMO_PAGE_SIZE_OPTIONS.map((option) => (
					<option key={option} value={option}>
						{option}
					</option>
				))}
			</select>
		</>
	);
}

export function StatsBar({
	totalRows,
	loadedRows,
	modeLabel,
	fetchStatus,
}: {
	fetchStatus: string;
	loadedRows: number;
	modeLabel: string;
	totalRows: number;
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

export function DatasetRowsTable({ rows }: { rows: PaginationDemoItem[] }) {
	return (
		<div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900/80">
			<GridTableHeader />
			<div className="h-140 overflow-auto">
				{rows.map((row) => (
					<PaginationDataRow key={row._id} row={row} />
				))}
			</div>
		</div>
	);
}

export function VirtualizedDatasetRowsTable({
	rows,
	hasMore,
	isFetchingNextPage,
	prefetchAheadRows,
	fetchNextPage,
	scrollRef,
}: {
	fetchNextPage: (limit?: number) => void;
	hasMore: boolean;
	isFetchingNextPage: boolean;
	prefetchAheadRows: number;
	rows: PaginationDemoItem[];
	scrollRef: RefObject<HTMLDivElement | null>;
}) {
	const rowVirtualizer = useVirtualizer({
		count: hasMore ? rows.length + 1 : rows.length,
		estimateSize: () => VIRTUAL_ROW_HEIGHT,
		getItemKey: (index) => rows[index]?._id ?? "loader-row",
		getScrollElement: () => scrollRef.current,
		overscan: 10,
	});

	const virtualItems = rowVirtualizer.getVirtualItems();

	useEffect(() => {
		const lastItem = virtualItems[virtualItems.length - 1];
		if (!lastItem) {
			return;
		}

		const prefetchIndex = Math.max(0, rows.length - prefetchAheadRows);
		if (lastItem.index >= prefetchIndex && hasMore && !isFetchingNextPage) {
			fetchNextPage();
		}
	}, [fetchNextPage, hasMore, isFetchingNextPage, prefetchAheadRows, rows.length, virtualItems]);

	return (
		<div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900/80">
			<GridTableHeader />
			<div ref={scrollRef} className="h-140 overflow-auto [overflow-anchor:none]">
				<div className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
					{virtualItems.map((virtualRow) => {
						const row = rows[virtualRow.index];
						const isLoaderRow = virtualRow.index > rows.length - 1;

						return (
							<div
								key={virtualRow.key}
								className={`grid w-full ${MASSIVE_DATA_GRID_COLUMNS} items-center border-b border-slate-800 px-4 py-3 text-sm text-slate-100`}
								style={{
									height: `${virtualRow.size}px`,
									left: 0,
									position: "absolute",
									top: 0,
									transform: `translateY(${virtualRow.start}px)`,
									width: "100%",
								}}
							>
								{isLoaderRow || !row ? (
									<span className="col-span-8 text-center text-xs text-slate-400">
										{hasMore ? "Loading more rows..." : "All rows loaded"}
									</span>
								) : (
									<RowCells row={row} />
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

export function LoadingState({ message }: { message: string }) {
	return (
		<div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-900/80 text-slate-300">
			<div className="size-5 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
			<p>{message}</p>
		</div>
	);
}

export function EmptyState() {
	return (
		<div className="flex min-h-80 flex-col items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 text-center text-slate-300">
			<p className="font-medium">No rows available.</p>
			<p className="max-w-md text-sm text-slate-400">
				Run the pagination demo seed migration to populate the persisted dataset before opening this
				page.
			</p>
		</div>
	);
}

export function formatInt(value: number) {
	return integerFormatter.format(value);
}

export function calculatePrefetchAheadRows(pageSize: number) {
	const safePageSize = Math.max(1, pageSize);
	return Math.max(MIN_PREFETCH_AHEAD_ROWS, Math.ceil(safePageSize * PREFETCH_LINEAR_SCALE));
}

function GridTableHeader() {
	return (
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
	);
}

function PaginationDataRow({ row }: { row: PaginationDemoItem }) {
	return (
		<div
			className={`grid w-full ${MASSIVE_DATA_GRID_COLUMNS} items-center border-b border-slate-800 px-4 py-3 text-sm text-slate-100`}
		>
			<RowCells row={row} />
		</div>
	);
}

function RowCells({ row }: { row: PaginationDemoItem }) {
	return (
		<>
			<span className="font-mono text-xs text-slate-300">{row.position}</span>
			<span className="truncate">{row.name}</span>
			<span>{row.region}</span>
			<span className={statusClassName(row.status)}>{row.status}</span>
			<span>{formatInt(row.score)}</span>
			<span>{formatInt(row.throughput)}</span>
			<span>{row.latencyMs}ms</span>
			<span className="text-xs text-slate-400">{formatTime(row.updatedAt)}</span>
		</>
	);
}

function statusClassName(status: PaginationDemoItem["status"]) {
	if (status === "active") return "text-emerald-300";
	if (status === "paused") return "text-amber-300";
	if (status === "error") return "text-rose-300";
	return "text-slate-300";
}

function formatTime(timestamp: number) {
	return new Date(timestamp).toLocaleTimeString("en-US", {
		hour: "2-digit",
		hour12: false,
		minute: "2-digit",
		second: "2-digit",
	});
}
