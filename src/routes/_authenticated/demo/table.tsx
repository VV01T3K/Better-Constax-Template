import { convexQuery } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
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
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
	Select as UiSelect,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const;
const PAGE_SIZE_ITEMS = PAGE_SIZE_OPTIONS.map((option) => ({
	label: `Show ${option}`,
	value: String(option),
}));
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

type TableRow_ = {
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

export const Route = createFileRoute("/_authenticated/demo/table")({
	beforeLoad: async ({ context }) => {
		const allowed = await context.queryClient.fetchQuery({
			...convexQuery(api.functions.authorization.hasPermission, {
				permission: "demo.table.access",
			}),
			staleTime: 0,
		});
		if (!allowed) throw redirect({ to: "/forbidden" });
	},
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			convexQuery(api.functions.tableDemo.page, {
				filter: "",
				sortKey: "id",
				sortDirection: "asc",
				pageIndex: DEFAULT_PAGINATION.pageIndex,
				pageSize: DEFAULT_PAGINATION.pageSize,
			}),
		);
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
			<div className="p-6">
				<Card>
					<CardContent className="text-muted-foreground p-6">Loading table data...</CardContent>
				</Card>
			</div>
		);
	}

	if (!data && isError) {
		return (
			<div className="p-6">
				<Card className="border-destructive">
					<CardContent className="p-6">
						<p className="font-semibold">Failed to load table data.</p>
						<p className="text-muted-foreground mt-1 text-sm">{formatUnknownError(error)}</p>
						<Button
							variant="destructive"
							size="sm"
							className="mt-3"
							onClick={() => {
								void refetch();
							}}
						>
							Retry
						</Button>
					</CardContent>
				</Card>
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
		<div className="p-6">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
				<Card>
					<CardContent className="space-y-3 pt-6">
						<div className="flex flex-wrap items-center gap-3">
							<Input
								value={globalFilterInput}
								onChange={(event) => {
									setGlobalFilterInput(event.target.value);
									setPagination((previous) => ({ ...previous, pageIndex: 0 }));
								}}
								className="min-w-60 flex-1"
								placeholder="Search all columns..."
							/>
							<Button
								variant="outline"
								onClick={() => {
									setGlobalFilterInput("");
									setPagination((previous) => ({ ...previous, pageIndex: 0 }));
								}}
							>
								Clear search
							</Button>
						</div>

						<div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
							<span>{data.totalRows} rows total</span>
							<span>{selectedCount} selected</span>
							<span>{isFetching ? "Refreshing..." : "Up to date"}</span>
						</div>

						<details>
							<summary className="text-muted-foreground cursor-pointer text-sm">Columns</summary>
							<div className="mt-2 flex flex-wrap gap-3 rounded-md border p-3">
								{table
									.getAllLeafColumns()
									.filter((column) => column.getCanHide())
									.map((column) => (
										<label key={column.id} className="inline-flex items-center gap-2 text-sm">
											<Checkbox
												checked={column.getIsVisible()}
												onCheckedChange={() => column.toggleVisibility(!column.getIsVisible())}
											/>
											<span>{getColumnLabel(column.id)}</span>
										</label>
									))}
							</div>
						</details>
					</CardContent>
				</Card>

				{isError ? (
					<Card className="border-destructive">
						<CardContent className="text-destructive p-3 text-sm">
							Refresh failed: {formatUnknownError(error)}
						</CardContent>
					</Card>
				) : null}

				<Table className="text-sm">
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									const isSorted = header.column.getIsSorted();
									const sortIndicator = isSorted === "asc" ? " ▲" : isSorted === "desc" ? " ▼" : "";

									return (
										<TableHead key={header.id}>
											{header.isPlaceholder ? null : header.column.getCanSort() ? (
												<Button
													variant="ghost"
													size="xs"
													onClick={header.column.getToggleSortingHandler()}
													className="h-auto px-0 py-0 font-semibold hover:bg-transparent"
												>
													{flexRender(header.column.columnDef.header, header.getContext())}
													{sortIndicator}
												</Button>
											) : (
												flexRender(header.column.columnDef.header, header.getContext())
											)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.length === 0 ? (
							<TableRow>
								<TableCell
									className="text-muted-foreground text-center"
									colSpan={table.getAllLeafColumns().length}
								>
									No results for the current filter.
								</TableCell>
							</TableRow>
						) : (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						)}
					</TableBody>
				</Table>

				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setPagination((previous) => ({ ...previous, pageIndex: 0 }))}
						disabled={pageIndexForView === 0}
					>
						{"<<"}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setPagination((previous) => ({
								...previous,
								pageIndex: Math.max(0, previous.pageIndex - 1),
							}));
						}}
						disabled={pageIndexForView === 0}
					>
						{"<"}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setPagination((previous) => ({
								...previous,
								pageIndex: Math.min(pageCount - 1, previous.pageIndex + 1),
							}));
						}}
						disabled={pageIndexForView >= pageCount - 1}
					>
						{">"}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() =>
							setPagination((previous) => ({
								...previous,
								pageIndex: Math.max(0, pageCount - 1),
							}))
						}
						disabled={pageIndexForView >= pageCount - 1}
					>
						{">>"}
					</Button>

					<span className="text-muted-foreground ml-2 text-sm">
						Page <strong className="text-foreground">{pageIndexForView + 1}</strong> of{" "}
						<strong className="text-foreground">{pageCount}</strong>
					</span>

					<span className="text-muted-foreground text-sm">
						| Go to:
						<Input
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
							className="ml-2 inline-block w-16"
						/>
					</span>

					<UiSelect
						items={PAGE_SIZE_ITEMS}
						value={String(pagination.pageSize)}
						onValueChange={(value) => {
							if (!value) return;
							setPagination((previous) => ({
								...previous,
								pageSize: Number(value),
								pageIndex: 0,
							}));
						}}
					>
						<SelectTrigger className="w-28">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{PAGE_SIZE_ITEMS.map((item) => (
									<SelectItem key={item.value} value={item.value}>
										{item.label}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</UiSelect>
				</div>

				<div className="flex flex-wrap gap-2">
					<Button
						onClick={() => {
							void queryClient.invalidateQueries({ queryKey: pageQuery.queryKey });
						}}
					>
						Refetch from Convex
					</Button>
					<Button
						variant="outline"
						onClick={() => setRowSelection({})}
						disabled={selectedCount === 0}
					>
						Clear selection
					</Button>
				</div>

				<Card>
					<CardContent className="p-4">
						<pre className="text-muted-foreground overflow-auto text-xs">
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
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

const TABLE_COLUMNS: ColumnDef<TableRow_>[] = [
	{
		id: "select",
		header: ({ table }) => (
			<div className="flex items-center justify-center">
				<Checkbox
					checked={table.getIsAllPageRowsSelected()}
					indeterminate={!table.getIsAllPageRowsSelected() && table.getIsSomePageRowsSelected()}
					onCheckedChange={() => table.toggleAllPageRowsSelected()}
					aria-label="Select all rows"
				/>
			</div>
		),
		cell: ({ row }) => (
			<div className="flex items-center justify-center">
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={() => row.toggleSelected()}
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
					<Progress value={value} className="flex-1" />
					<span className="text-muted-foreground text-xs">{value}%</span>
				</div>
			);
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const value = row.original.status;
			const variant =
				value === "single" ? "default" : value === "relationship" ? "secondary" : "outline";

			return <Badge variant={variant}>{value}</Badge>;
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
