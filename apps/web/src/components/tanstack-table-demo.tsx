"use client";

import type {
	TanstackTableDemoPriority,
	TanstackTableDemoRow,
	TanstackTableDemoSortKey,
	TanstackTableDemoStatus,
} from "@repo/convex/schemas/tanstack-table-demo";
import { tanstackTableDemoStatusValues } from "@repo/convex/schemas/tanstack-table-demo";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	columnVisibilityFeature,
	type Column,
	createColumnHelper,
	rowPaginationFeature,
	type RowSelectionState,
	rowSelectionFeature,
	type SortingState,
	rowSortingFeature,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronsLeft,
	ChevronsRight,
	Columns3,
	RefreshCcw,
	Search,
	X,
} from "lucide-react";
import { startTransition, useDeferredValue, useEffect, useState } from "react";

import { useCRPC } from "../integrations/convex/crpc";

const currencyFormatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
	hour: "numeric",
	minute: "2-digit",
});

const tanstackTableFeatures = tableFeatures({
	columnVisibilityFeature,
	rowPaginationFeature,
	rowSelectionFeature,
	rowSortingFeature,
});

const defaultSorting: SortingState = [{ id: "updatedAt", desc: true }];
const defaultPagination = {
	pageIndex: 0,
	pageSize: 10,
};
const pageSizeOptions = [5, 10, 20] as const;

const columnHelper = createColumnHelper<typeof tanstackTableFeatures, TanstackTableDemoRow>();

const statusLabels: Record<TanstackTableDemoStatus, string> = {
	blocked: "Blocked",
	queued: "Queued",
	ready: "Ready",
	review: "Review",
};

const priorityLabels: Record<TanstackTableDemoPriority, string> = {
	high: "High",
	low: "Low",
	medium: "Medium",
	urgent: "Urgent",
};

const columns = columnHelper.columns([
	columnHelper.display({
		id: "select",
		enableHiding: false,
		enableSorting: false,
		header: ({ table }) => (
			<div className="flex items-center justify-center">
				<Checkbox
					aria-label="Select all rows on the current page"
					checked={table.getIsAllPageRowsSelected()}
					onCheckedChange={(checked) => table.toggleAllPageRowsSelected(Boolean(checked))}
				/>
			</div>
		),
		cell: ({ row }) => (
			<div className="flex items-center justify-center">
				<Checkbox
					aria-label={`Select ${row.original.caseId}`}
					checked={row.getIsSelected()}
					onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
				/>
			</div>
		),
	}),
	columnHelper.accessor("caseId", {
		header: ({ column }) => <SortableHeader column={column} label="Case" />,
		cell: ({ row }) => <span className="font-medium">{row.original.caseId}</span>,
	}),
	columnHelper.accessor("name", {
		header: ({ column }) => <SortableHeader column={column} label="Work Item" />,
		cell: ({ row }) => <span className="max-w-56 truncate">{row.original.name}</span>,
	}),
	columnHelper.accessor("owner", {
		header: ({ column }) => <SortableHeader column={column} label="Owner" />,
	}),
	columnHelper.accessor("status", {
		header: ({ column }) => <SortableHeader column={column} label="Status" />,
		cell: ({ row }) => <StatusBadge status={row.original.status} />,
	}),
	columnHelper.accessor("priority", {
		header: ({ column }) => <SortableHeader column={column} label="Priority" />,
		cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
	}),
	columnHelper.accessor("region", {
		header: ({ column }) => <SortableHeader column={column} label="Region" />,
		cell: ({ row }) => <span className="uppercase">{row.original.region}</span>,
	}),
	columnHelper.accessor("amountCents", {
		header: ({ column }) => <SortableHeader column={column} label="Exposure" />,
		cell: ({ row }) => (
			<span className="block text-right font-medium">
				{currencyFormatter.format(row.original.amountCents / 100)}
			</span>
		),
	}),
	columnHelper.accessor("updatedAt", {
		header: ({ column }) => <SortableHeader column={column} label="Updated" />,
		cell: ({ row }) => <span>{dateFormatter.format(row.original.updatedAt)}</span>,
	}),
]);

export function TanStackTableDemoPage() {
	const c = useCRPC();
	const queryClient = useQueryClient();
	const [searchValue, setSearchValue] = useState("");
	const [statusFilter, setStatusFilter] = useState<"all" | TanstackTableDemoStatus>("all");
	const [sorting, setSorting] = useState<SortingState>(defaultSorting);
	const [pagination, setPagination] = useState(defaultPagination);
	const [columnVisibility, setColumnVisibility] = useState({
		amountCents: false,
	});
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const deferredSearchValue = useDeferredValue(searchValue);

	const pageQuery = c.func.tanstackTableDemo.page.queryOptions({
		filter: deferredSearchValue.trim(),
		pageIndex: pagination.pageIndex,
		pageSize: pagination.pageSize,
		sortDirection: sorting[0]?.desc ? "desc" : "asc",
		sortKey: toSortKey(sorting[0]?.id),
		status: statusFilter,
	});

	const query = useQuery({
		...pageQuery,
		placeholderData: keepPreviousData,
	});

	const table = useTable({
		_features: tanstackTableFeatures,
		columns,
		data: query.data?.rows ?? [],
		enableSortingRemoval: false,
		getRowId: (row: TanstackTableDemoRow) => row._id,
		manualPagination: true,
		manualSorting: true,
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: setPagination,
		onRowSelectionChange: setRowSelection,
		onSortingChange: (updater) => {
			setSorting((current) => {
				const next = typeof updater === "function" ? updater(current) : updater;
				return next.slice(0, 1);
			});
			setPagination((current) => ({
				...current,
				pageIndex: 0,
			}));
		},
		pageCount: query.data?.pageCount ?? 1,
		state: {
			columnVisibility,
			pagination,
			rowSelection,
			sorting,
		},
	});

	useEffect(() => {
		if (!query.data) {
			return;
		}

		if (query.data.pageIndex === pagination.pageIndex) {
			return;
		}

		setPagination((current) => ({
			...current,
			pageIndex: query.data.pageIndex,
		}));
	}, [pagination.pageIndex, query.data]);

	useEffect(() => {
		if (!query.data) {
			return;
		}

		const nextPageIndex = query.data.pageIndex + 1;
		if (nextPageIndex >= query.data.pageCount) {
			return;
		}

		void queryClient.prefetchQuery(
			c.func.tanstackTableDemo.page.queryOptions({
				filter: deferredSearchValue.trim(),
				pageIndex: nextPageIndex,
				pageSize: pagination.pageSize,
				sortDirection: sorting[0]?.desc ? "desc" : "asc",
				sortKey: toSortKey(sorting[0]?.id),
				status: statusFilter,
			}),
		);
	}, [c, deferredSearchValue, pagination.pageSize, query.data, queryClient, sorting, statusFilter]);

	if (!query.data && query.isPending) {
		return (
			<div className="flex min-h-screen flex-col gap-4">
				<Card>
					<CardContent>Loading paginated Convex table data...</CardContent>
				</Card>
			</div>
		);
	}

	if (!query.data && query.isError) {
		return (
			<div className="flex min-h-screen flex-col gap-4">
				<Card>
					<CardContent>Failed to load paginated Convex table data.</CardContent>
				</Card>
			</div>
		);
	}

	if (!query.data) {
		return null;
	}

	const selectedCount = Object.keys(rowSelection).length;

	return (
		<div className="flex min-h-screen flex-col gap-4">
			<Card>
				<CardHeader>
					<CardTitle>TanStack Table v9 Alpha</CardTitle>
					<CardDescription>
						Convex-backed server pagination with manual sorting and filtering.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
						<div className="relative">
							<Search
								data-icon="inline-start"
								className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2"
							/>
							<Input
								value={searchValue}
								onChange={(event) => {
									setSearchValue(event.target.value);
									setPagination((current) => ({
										...current,
										pageIndex: 0,
									}));
								}}
								placeholder="Search by case, work item, owner, status, or region"
								className="pl-8"
								aria-label="Search work queue"
							/>
						</div>
						<Select<string>
							value={statusFilter}
							onValueChange={(value) => {
								if (value !== "all" && !isTanstackTableDemoStatus(value)) {
									return;
								}

								setStatusFilter(value);
								setPagination((current) => ({
									...current,
									pageIndex: 0,
								}));
							}}
						>
							<SelectTrigger aria-label="Filter by status">
								<SelectValue placeholder="All statuses" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="all">All statuses</SelectItem>
									{tanstackTableDemoStatusValues.map((status) => (
										<SelectItem key={status} value={status}>
											{statusLabels[status]}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
						<div className="flex items-center justify-end gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setSearchValue("");
									setPagination((current) => ({
										...current,
										pageIndex: 0,
									}));
								}}
								disabled={searchValue.length === 0}
							>
								<X data-icon="inline-start" />
								Clear
							</Button>
							<DropdownMenu>
								<DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
									<Columns3 data-icon="inline-start" />
									Columns
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuGroup>
										<DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
										<DropdownMenuSeparator />
										{table
											.getAllLeafColumns()
											.filter((column) => column.id !== "select")
											.map((column) => (
												<DropdownMenuCheckboxItem
													key={column.id}
													checked={column.getIsVisible()}
													onCheckedChange={(checked) => column.toggleVisibility(Boolean(checked))}
												>
													{getColumnLabel(column.id)}
												</DropdownMenuCheckboxItem>
											))}
									</DropdownMenuGroup>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="secondary">{query.data.totalRows} matching rows</Badge>
						<Badge variant="secondary">{query.data.rows.length} on page</Badge>
						<Badge variant="outline">{selectedCount} selected</Badge>
						{deferredSearchValue.trim() ? (
							<Badge variant="outline">Query: {deferredSearchValue.trim()}</Badge>
						) : null}
						{statusFilter !== "all" ? (
							<Badge variant="outline">Status: {statusLabels[statusFilter]}</Badge>
						) : null}
					</div>

					<div className="bg-muted/20 flex flex-wrap items-center gap-2 border px-3 py-2 text-xs">
						<span className="text-muted-foreground">
							Page {query.data.pageIndex + 1} / {query.data.pageCount}
						</span>
						<span className="text-muted-foreground">Page size {query.data.pageSize}</span>
						<span className="text-muted-foreground">
							Sort{" "}
							{sorting[0]
								? `${getColumnLabel(sorting[0].id)} ${sorting[0].desc ? "desc" : "asc"}`
								: "default"}
						</span>
						<span className="text-muted-foreground">
							{query.isFetching ? "Refreshing..." : "Up to date"}
						</span>
						<Button
							variant="outline"
							size="xs"
							onClick={() => {
								void queryClient.invalidateQueries({ queryKey: pageQuery.queryKey });
							}}
							className="ml-auto"
						>
							<RefreshCcw data-icon="inline-start" />
							Refetch Convex
						</Button>
						<Button
							variant="outline"
							size="xs"
							onClick={() => setRowSelection({})}
							disabled={selectedCount === 0}
						>
							Clear selection
						</Button>
					</div>

					<div className="border">
						<Table>
							<TableCaption>
								Rows are paginated on the Convex query before reaching the client.
							</TableCaption>
							<TableHeader>
								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow key={headerGroup.id}>
										{headerGroup.headers.map((header) => (
											<TableHead
												key={header.id}
												className={header.id === "amountCents" ? "text-right" : undefined}
											>
												{header.isPlaceholder ? null : <table.FlexRender header={header} />}
											</TableHead>
										))}
									</TableRow>
								))}
							</TableHeader>
							<TableBody>
								{table.getRowModel().rows.length > 0 ? (
									table.getRowModel().rows.map((row) => (
										<TableRow
											key={row.id}
											data-state={row.getIsSelected() ? "selected" : undefined}
										>
											{row.getVisibleCells().map((cell) => (
												<TableCell
													key={cell.id}
													className={cell.column.id === "amountCents" ? "text-right" : undefined}
												>
													<table.FlexRender cell={cell} />
												</TableCell>
											))}
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell
											colSpan={table.getVisibleLeafColumns().length}
											className="h-28 text-center"
										>
											No rows match the current filters.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>

					<div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
						<div className="flex items-center gap-2">
							<Select<string>
								value={String(pagination.pageSize)}
								onValueChange={(value) => {
									startTransition(() => {
										setPagination({
											pageIndex: 0,
											pageSize: Number(value),
										});
									});
								}}
							>
								<SelectTrigger aria-label="Rows per page" className="w-32">
									<SelectValue placeholder="Rows per page" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{pageSizeOptions.map((option) => (
											<SelectItem key={option} value={String(option)}>
												Show {option}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => table.firstPage()}
								disabled={!table.getCanPreviousPage()}
							>
								{"<<"}
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
							>
								<ChevronsLeft data-icon="inline-start" />
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
							>
								Next
								<ChevronsRight data-icon="inline-end" />
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => table.lastPage()}
								disabled={!table.getCanNextPage()}
							>
								{">>"}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function SortableHeader({
	column,
	label,
}: {
	column: Column<typeof tanstackTableFeatures, TanstackTableDemoRow>;
	label: string;
}) {
	const direction = column.getIsSorted();

	return (
		<Button
			variant="ghost"
			size="xs"
			onClick={() => column.toggleSorting(direction === "asc")}
			className="-ml-2"
		>
			{label}
			{direction === "asc" ? (
				<ArrowUp data-icon="inline-end" />
			) : direction === "desc" ? (
				<ArrowDown data-icon="inline-end" />
			) : (
				<ArrowUpDown data-icon="inline-end" />
			)}
		</Button>
	);
}

function StatusBadge({ status }: { status: TanstackTableDemoStatus }) {
	const variant =
		status === "blocked" ? "destructive" : status === "review" ? "secondary" : "outline";

	return <Badge variant={variant}>{statusLabels[status]}</Badge>;
}

function PriorityBadge({ priority }: { priority: TanstackTableDemoPriority }) {
	const variant =
		priority === "urgent" ? "destructive" : priority === "high" ? "secondary" : "outline";

	return <Badge variant={variant}>{priorityLabels[priority]}</Badge>;
}

function getColumnLabel(columnId: string) {
	switch (columnId) {
		case "amountCents":
			return "Exposure";
		case "caseId":
			return "Case";
		case "name":
			return "Work Item";
		case "updatedAt":
			return "Updated";
		default:
			return columnId.charAt(0).toUpperCase() + columnId.slice(1);
	}
}

function isTanstackTableDemoStatus(value: unknown): value is TanstackTableDemoStatus {
	return (
		typeof value === "string" && tanstackTableDemoStatusValues.some((status) => status === value)
	);
}

function toSortKey(value: string | undefined): TanstackTableDemoSortKey {
	switch (value) {
		case "amountCents":
		case "caseId":
		case "name":
		case "owner":
		case "priority":
		case "region":
		case "status":
		case "updatedAt":
			return value;
		default:
			return "updatedAt";
	}
}
