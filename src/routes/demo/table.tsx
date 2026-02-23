import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	flexRender,
	functionalUpdate,
	getCoreRowModel,
	type ColumnDef,
	type PaginationState,
	type RowSelectionState,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import { type InputHTMLAttributes, useEffect, useRef, useState } from "react";

import { protectedRouteLoaderWithPrefetch } from "@/lib/route-guard-kit";

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const;
const FILTER_DEBOUNCE_MS = 250;

const SORT_KEYS = [
	"id",
	"firstName",
	"lastName",
	"fullName",
	"age",
	"visits",
	"progress",
	"status",
] as const;
const SORT_KEY_SET = new Set<string>(SORT_KEYS);

type SortKey = (typeof SORT_KEYS)[number];
type SortDirection = "asc" | "desc";

type TableRow = {
	id: number;
	firstName: string;
	lastName: string;
	fullName: string;
	age: number;
	visits: number;
	progress: number;
	status: "single" | "relationship" | "complicated";
};

const DEFAULT_SORTING: SortingState = [{ id: "id", desc: false }];
const DEFAULT_PAGINATION: PaginationState = { pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE };

export const Route = createFileRoute("/demo/table")({
	loader: async ({ context, location }) => {
		await protectedRouteLoaderWithPrefetch({
			queryClient: context.queryClient,
			permission: "demo.table.access",
			redirectHref: location.href,
			prefetch: () =>
				context.queryClient.ensureQueryData(
					convexQuery(api.functions.tableDemo.page, {
						filter: "",
						sortKey: "id",
						sortDirection: "asc",
						pageIndex: DEFAULT_PAGINATION.pageIndex,
						pageSize: DEFAULT_PAGINATION.pageSize,
					}),
				),
		});
	},
	component: TableDemo,
});

function TableDemo() {
	const queryClient = useQueryClient();

	const [globalFilterInput, setGlobalFilterInput] = useState("");
	const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORTING);
	const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

	const debouncedFilter = useDebouncedValue(globalFilterInput, FILTER_DEBOUNCE_MS);
	const { sortKey, sortDirection } = sortingToQuery(sorting);

	const pageQuery = convexQuery(api.functions.tableDemo.page, {
		filter: debouncedFilter,
		sortKey,
		sortDirection,
		pageIndex: pagination.pageIndex,
		pageSize: pagination.pageSize,
	});

	const { data, isPending, isFetching, isError, error, refetch } = useQuery({
		...pageQuery,
		placeholderData: (previousData) => previousData,
	});

	useEffect(() => {
		if (!data) return;
		if (pagination.pageIndex === data.pageIndex) return;
		setPagination((previous) => ({ ...previous, pageIndex: data.pageIndex }));
	}, [data, pagination.pageIndex]);

	useEffect(() => {
		if (!data) return;
		const nextPageIndex = data.pageIndex + 1;
		if (nextPageIndex >= data.pageCount) return;

		void queryClient.prefetchQuery(
			convexQuery(api.functions.tableDemo.page, {
				filter: debouncedFilter,
				sortKey,
				sortDirection,
				pageIndex: nextPageIndex,
				pageSize: pagination.pageSize,
			}),
		);
	}, [data, debouncedFilter, pagination.pageSize, queryClient, sortDirection, sortKey]);

	const table = useReactTable({
		data: data?.rows ?? [],
		columns: TABLE_COLUMNS,
		state: {
			sorting,
			pagination,
			columnVisibility,
			rowSelection,
		},
		onSortingChange: (updater) => {
			setSorting((previous) => {
				const next = functionalUpdate(updater, previous);
				return next.slice(0, 1);
			});
			setPagination((previous) => ({ ...previous, pageIndex: 0 }));
		},
		onPaginationChange: setPagination,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		manualPagination: true,
		manualSorting: true,
		manualFiltering: true,
		pageCount: data?.pageCount ?? 1,
		getRowId: (row) => String(row.id),
		enableSortingRemoval: false,
		enableMultiSort: false,
		enableRowSelection: true,
		getCoreRowModel: getCoreRowModel(),
	});

	if (!data && isPending) {
		return (
			<div className="min-h-screen bg-gray-900 p-6 text-gray-200">
				<div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
					Loading table data...
				</div>
			</div>
		);
	}

	if (!data && isError) {
		return (
			<div className="min-h-screen bg-gray-900 p-6 text-gray-200">
				<div className="rounded-lg border border-rose-700 bg-rose-950/40 p-4">
					<p className="font-semibold">Failed to load table data.</p>
					<p className="mt-1 text-sm text-gray-300">{formatUnknownError(error)}</p>
					<button
						type="button"
						onClick={() => {
							void refetch();
						}}
						className="mt-3 rounded-md bg-rose-600 px-3 py-2 text-sm text-white hover:bg-rose-700"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	if (!data) {
		return null;
	}

	const pageCount = data.pageCount;
	const pageIndexForView = data.pageIndex;
	const selectedCount = Object.keys(rowSelection).length;

	return (
		<div className="min-h-screen bg-gray-900 p-6 text-gray-200">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
				<div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
					<div className="flex flex-wrap items-center gap-3">
						<input
							type="text"
							value={globalFilterInput}
							onChange={(event) => {
								setGlobalFilterInput(event.target.value);
								setPagination((previous) => ({ ...previous, pageIndex: 0 }));
							}}
							className="w-full min-w-60 flex-1 rounded-lg border border-gray-700 bg-gray-900 p-3 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
							placeholder="Search all columns..."
						/>
						<button
							type="button"
							onClick={() => {
								setGlobalFilterInput("");
								setPagination((previous) => ({ ...previous, pageIndex: 0 }));
							}}
							className="rounded-md bg-gray-700 px-3 py-2 text-sm hover:bg-gray-600"
						>
							Clear search
						</button>
					</div>

					<div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-300">
						<div>{data.totalRows} rows total</div>
						<div>{selectedCount} selected</div>
						<div>{isFetching ? "Refreshing..." : "Up to date"}</div>
					</div>

					<details className="mt-3">
						<summary className="cursor-pointer text-sm text-gray-300">Columns</summary>
						<div className="mt-2 flex flex-wrap gap-3 rounded-md border border-gray-700 bg-gray-900 p-3">
							{table
								.getAllLeafColumns()
								.filter((column) => column.getCanHide())
								.map((column) => (
									<label key={column.id} className="inline-flex items-center gap-2 text-sm">
										<input
											type="checkbox"
											checked={column.getIsVisible()}
											onChange={column.getToggleVisibilityHandler()}
											className="h-4 w-4"
										/>
										<span>{getColumnLabel(column.id)}</span>
									</label>
								))}
						</div>
					</details>
				</div>

				{isError ? (
					<p className="rounded-md border border-rose-700 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">
						Refresh failed: {formatUnknownError(error)}
					</p>
				) : null}

				<div className="overflow-x-auto rounded-lg border border-gray-700">
					<table className="w-full text-sm text-gray-200">
						<thead className="bg-gray-800 text-gray-100">
							{table.getHeaderGroups().map((headerGroup) => (
								<tr key={headerGroup.id}>
									{headerGroup.headers.map((header) => {
										const isSorted = header.column.getIsSorted();
										const sortIndicator =
											isSorted === "asc" ? " ▲" : isSorted === "desc" ? " ▼" : "";

										return (
											<th key={header.id} className="px-4 py-3 text-left">
												{header.isPlaceholder ? null : header.column.getCanSort() ? (
													<button
														type="button"
														onClick={header.column.getToggleSortingHandler()}
														className="cursor-pointer font-semibold transition-colors select-none hover:text-blue-400"
													>
														{flexRender(header.column.columnDef.header, header.getContext())}
														{sortIndicator}
													</button>
												) : (
													flexRender(header.column.columnDef.header, header.getContext())
												)}
											</th>
										);
									})}
								</tr>
							))}
						</thead>
						<tbody className="divide-y divide-gray-700">
							{table.getRowModel().rows.length === 0 ? (
								<tr>
									<td
										className="px-4 py-8 text-center text-gray-400"
										colSpan={table.getAllLeafColumns().length}
									>
										No results for the current filter.
									</td>
								</tr>
							) : (
								table.getRowModel().rows.map((row) => (
									<tr
										key={row.id}
										className={`transition-colors hover:bg-gray-800 ${row.getIsSelected() ? "bg-blue-950/20" : ""}`}
									>
										{row.getVisibleCells().map((cell) => (
											<td key={cell.id} className="px-4 py-3 align-middle">
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</td>
										))}
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={() => setPagination((previous) => ({ ...previous, pageIndex: 0 }))}
						disabled={pageIndexForView === 0}
						className="rounded-md bg-gray-800 px-3 py-1 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{"<<"}
					</button>
					<button
						type="button"
						onClick={() => {
							setPagination((previous) => ({
								...previous,
								pageIndex: Math.max(0, previous.pageIndex - 1),
							}));
						}}
						disabled={pageIndexForView === 0}
						className="rounded-md bg-gray-800 px-3 py-1 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{"<"}
					</button>
					<button
						type="button"
						onClick={() => {
							setPagination((previous) => ({
								...previous,
								pageIndex: Math.min(pageCount - 1, previous.pageIndex + 1),
							}));
						}}
						disabled={pageIndexForView >= pageCount - 1}
						className="rounded-md bg-gray-800 px-3 py-1 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{">"}
					</button>
					<button
						type="button"
						onClick={() =>
							setPagination((previous) => ({ ...previous, pageIndex: Math.max(0, pageCount - 1) }))
						}
						disabled={pageIndexForView >= pageCount - 1}
						className="rounded-md bg-gray-800 px-3 py-1 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{">>"}
					</button>

					<span className="ml-2 text-sm">
						Page <strong>{pageIndexForView + 1}</strong> of <strong>{pageCount}</strong>
					</span>

					<span className="text-sm">
						| Go to page:
						<input
							type="number"
							min={1}
							max={pageCount}
							value={pageIndexForView + 1}
							onChange={(event) => {
								const nextPage = Number(event.target.value) - 1;
								if (!Number.isFinite(nextPage)) return;
								setPagination((previous) => ({
									...previous,
									pageIndex: Math.min(pageCount - 1, Math.max(0, nextPage)),
								}));
							}}
							className="ml-2 w-16 rounded-md border border-gray-700 bg-gray-800 px-2 py-1 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
						/>
					</span>

					<select
						value={pagination.pageSize}
						onChange={(event) => {
							setPagination((previous) => ({
								...previous,
								pageSize: Number(event.target.value),
								pageIndex: 0,
							}));
						}}
						className="rounded-md border border-gray-700 bg-gray-800 px-2 py-1 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
					>
						{PAGE_SIZE_OPTIONS.map((option) => (
							<option key={option} value={option}>
								Show {option}
							</option>
						))}
					</select>
				</div>

				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={() => {
							void queryClient.invalidateQueries({ queryKey: pageQuery.queryKey });
						}}
						className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
					>
						Refetch from Convex
					</button>
					<button
						type="button"
						onClick={() => setRowSelection({})}
						disabled={selectedCount === 0}
						className="rounded-md bg-gray-700 px-4 py-2 transition-colors hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Clear selection
					</button>
				</div>

				<pre className="overflow-auto rounded-lg bg-gray-800 p-4 text-gray-300">
					{JSON.stringify(
						{
							globalFilterInput,
							debouncedFilter,
							sortKey,
							sortDirection,
							pageIndex: pageIndexForView,
							pageSize: pagination.pageSize,
							prefetchedNextPage: pageIndexForView + 1 < pageCount,
							totalRows: data.totalRows,
							selectedCount,
						},
						null,
						2,
					)}
				</pre>
			</div>
		</div>
	);
}

const TABLE_COLUMNS: ColumnDef<TableRow>[] = [
	{
		id: "select",
		header: ({ table }) => (
			<div className="flex items-center justify-center">
				<IndeterminateCheckbox
					checked={table.getIsAllPageRowsSelected()}
					indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
					onChange={table.getToggleAllPageRowsSelectedHandler()}
					aria-label="Select all rows"
				/>
			</div>
		),
		cell: ({ row }) => (
			<div className="flex items-center justify-center">
				<IndeterminateCheckbox
					checked={row.getIsSelected()}
					indeterminate={row.getIsSomeSelected() && !row.getIsSelected()}
					onChange={row.getToggleSelectedHandler()}
					aria-label={`Select row ${row.original.id}`}
				/>
			</div>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "id",
		header: "ID",
	},
	{
		accessorKey: "firstName",
		header: "First Name",
	},
	{
		accessorKey: "lastName",
		header: "Last Name",
	},
	{
		accessorKey: "fullName",
		header: "Full Name",
	},
	{
		accessorKey: "age",
		header: "Age",
	},
	{
		accessorKey: "visits",
		header: "Visits",
	},
	{
		accessorKey: "progress",
		header: "Progress",
		cell: ({ row }) => {
			const value = row.original.progress;
			return (
				<div className="flex min-w-28 items-center gap-2">
					<div className="h-2 flex-1 rounded bg-gray-700">
						<div className="h-2 rounded bg-blue-500" style={{ width: `${value}%` }} />
					</div>
					<span>{value}%</span>
				</div>
			);
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const value = row.original.status;
			const colorClass =
				value === "single"
					? "text-emerald-300"
					: value === "relationship"
						? "text-blue-300"
						: "text-amber-300";

			return <span className={colorClass}>{value}</span>;
		},
	},
];

function useDebouncedValue<T>(value: T, delayMs: number) {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setDebouncedValue(value);
		}, delayMs);

		return () => clearTimeout(timeoutId);
	}, [delayMs, value]);

	return debouncedValue;
}

function sortingToQuery(sorting: SortingState): { sortKey: SortKey; sortDirection: SortDirection } {
	const firstSort = sorting[0];
	if (!firstSort || !isSortKey(firstSort.id)) {
		return { sortKey: "id", sortDirection: "asc" };
	}
	return {
		sortKey: firstSort.id,
		sortDirection: firstSort.desc ? "desc" : "asc",
	};
}

function isSortKey(value: string): value is SortKey {
	return SORT_KEY_SET.has(value);
}

function formatUnknownError(error: unknown) {
	if (error instanceof Error) return error.message;
	return "Unknown error";
}

function IndeterminateCheckbox({
	indeterminate = false,
	...props
}: { indeterminate?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
	const ref = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!ref.current) return;
		ref.current.indeterminate = indeterminate;
	}, [indeterminate]);

	return (
		<input
			ref={ref}
			type="checkbox"
			className="h-4 w-4 rounded border-gray-600 bg-gray-800"
			{...props}
		/>
	);
}

function getColumnLabel(columnId: string) {
	if (columnId === "select") return "Select";
	if (columnId === "id") return "ID";
	if (columnId === "firstName") return "First Name";
	if (columnId === "lastName") return "Last Name";
	if (columnId === "fullName") return "Full Name";
	if (columnId === "age") return "Age";
	if (columnId === "visits") return "Visits";
	if (columnId === "progress") return "Progress";
	if (columnId === "status") return "Status";
	return columnId;
}
