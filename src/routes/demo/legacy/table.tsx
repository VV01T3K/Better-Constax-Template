import { rankItem } from "@tanstack/match-sorter-utils";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useReducer, useState } from "react";

import type { Person } from "@/data/demo-table-data";
import { makeData } from "@/data/demo-table-data";

export const Route = createFileRoute("/demo/legacy/table")({
	component: TableDemo,
});

type SortKey = "id" | "firstName" | "lastName" | "fullName";
type SortDirection = "asc" | "desc";

type TableState = {
	globalFilter: string;
	sortKey: SortKey;
	sortDirection: SortDirection;
	pageIndex: number;
	pageSize: number;
};

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const;

function TableDemo() {
	const rerender = useReducer(() => ({}), {})[1];
	const [data, setData] = useState<Person[]>(() => makeData(5_000));
	const [tableState, setTableState] = useState<TableState>({
		globalFilter: "",
		sortKey: "id",
		sortDirection: "asc",
		pageIndex: 0,
		pageSize: 20,
	});

	const { globalFilter, sortKey, sortDirection, pageIndex, pageSize } = tableState;

	const refreshData = () => setData(() => makeData(50_000));

	const filteredRows = useMemo(() => {
		const normalizedFilter = globalFilter.trim();
		if (normalizedFilter.length === 0) {
			return data;
		}

		return data.filter((row) => {
			const searchable = [
				String(row.id),
				row.firstName,
				row.lastName,
				fullName(row),
				String(row.age),
				String(row.visits),
				String(row.progress),
				row.status,
			].join(" ");

			return rankItem(searchable, normalizedFilter).passed;
		});
	}, [data, globalFilter]);

	const sortedRows = useMemo(() => {
		const rows = [...filteredRows];
		rows.sort((a, b) => {
			const left = getSortableValue(a, sortKey);
			const right = getSortableValue(b, sortKey);
			const direction = sortDirection === "asc" ? 1 : -1;
			return compareValues(left, right) * direction;
		});
		return rows;
	}, [filteredRows, sortDirection, sortKey]);

	const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
	const pageIndexForView = Math.min(pageIndex, pageCount - 1);
	const pagedRows = useMemo(() => {
		const start = pageIndexForView * pageSize;
		return sortedRows.slice(start, start + pageSize);
	}, [pageIndexForView, pageSize, sortedRows]);

	const toggleSort = (nextKey: SortKey) => {
		setTableState((prev) => {
			if (prev.sortKey === nextKey) {
				return {
					...prev,
					sortDirection: prev.sortDirection === "asc" ? "desc" : "asc",
					pageIndex: 0,
				};
			}
			return {
				...prev,
				sortKey: nextKey,
				sortDirection: "asc",
				pageIndex: 0,
			};
		});
	};

	return (
		<div className="min-h-screen bg-gray-900 p-6">
			<div>
				<input
					type="text"
					value={globalFilter}
					onChange={(event) => {
						setTableState((prev) => ({
							...prev,
							globalFilter: event.target.value,
							pageIndex: 0,
						}));
					}}
					className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
					placeholder="Search all columns..."
				/>
			</div>

			<div className="h-4" />

			<div className="overflow-x-auto rounded-lg border border-gray-700">
				<table className="w-full text-sm text-gray-200">
					<thead className="bg-gray-800 text-gray-100">
						<tr>
							<SortableHeader
								label="ID"
								sortKey="id"
								activeSortKey={sortKey}
								sortDirection={sortDirection}
								onToggleSort={toggleSort}
							/>
							<SortableHeader
								label="First Name"
								sortKey="firstName"
								activeSortKey={sortKey}
								sortDirection={sortDirection}
								onToggleSort={toggleSort}
							/>
							<SortableHeader
								label="Last Name"
								sortKey="lastName"
								activeSortKey={sortKey}
								sortDirection={sortDirection}
								onToggleSort={toggleSort}
							/>
							<SortableHeader
								label="Full Name"
								sortKey="fullName"
								activeSortKey={sortKey}
								sortDirection={sortDirection}
								onToggleSort={toggleSort}
							/>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-700">
						{pagedRows.map((row) => (
							<tr key={row.id} className="transition-colors hover:bg-gray-800">
								<td className="px-4 py-3">{row.id}</td>
								<td className="px-4 py-3">{row.firstName}</td>
								<td className="px-4 py-3">{row.lastName}</td>
								<td className="px-4 py-3">{fullName(row)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className="h-4" />

			<div className="flex flex-wrap items-center gap-2 text-gray-200">
				<button
					type="button"
					className="rounded-md bg-gray-800 px-3 py-1 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
					onClick={() => {
						setTableState((prev) => ({ ...prev, pageIndex: 0 }));
					}}
					disabled={pageIndexForView === 0}
				>
					{"<<"}
				</button>
				<button
					type="button"
					className="rounded-md bg-gray-800 px-3 py-1 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
					onClick={() => {
						setTableState((prev) => ({ ...prev, pageIndex: Math.max(0, prev.pageIndex - 1) }));
					}}
					disabled={pageIndexForView === 0}
				>
					{"<"}
				</button>
				<button
					type="button"
					className="rounded-md bg-gray-800 px-3 py-1 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
					onClick={() => {
						setTableState((prev) => ({
							...prev,
							pageIndex: Math.min(pageCount - 1, prev.pageIndex + 1),
						}));
					}}
					disabled={pageIndexForView >= pageCount - 1}
				>
					{">"}
				</button>
				<button
					type="button"
					className="rounded-md bg-gray-800 px-3 py-1 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
					onClick={() => {
						setTableState((prev) => ({ ...prev, pageIndex: Math.max(0, pageCount - 1) }));
					}}
					disabled={pageIndexForView >= pageCount - 1}
				>
					{">>"}
				</button>
				<span className="flex items-center gap-1">
					<div>Page</div>
					<strong>
						{pageIndexForView + 1} of {pageCount}
					</strong>
				</span>
				<span className="flex items-center gap-1">
					| Go to page:
					<input
						type="number"
						value={pageIndexForView + 1}
						onChange={(event) => {
							const nextPage = Number(event.target.value) - 1;
							if (!Number.isFinite(nextPage)) {
								setTableState((prev) => ({ ...prev, pageIndex: 0 }));
								return;
							}
							setTableState((prev) => ({
								...prev,
								pageIndex: Math.min(pageCount - 1, Math.max(0, nextPage)),
							}));
						}}
						className="w-16 rounded-md border border-gray-700 bg-gray-800 px-2 py-1 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
					/>
				</span>
				<select
					value={pageSize}
					onChange={(event) => {
						setTableState((prev) => ({
							...prev,
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

			<div className="mt-4 text-gray-400">{filteredRows.length} Rows</div>

			<div className="mt-4 flex gap-2">
				<button
					type="button"
					onClick={() => rerender()}
					className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
				>
					Force Rerender
				</button>
				<button
					type="button"
					onClick={refreshData}
					className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
				>
					Refresh Data
				</button>
			</div>

			<pre className="mt-4 overflow-auto rounded-lg bg-gray-800 p-4 text-gray-300">
				{JSON.stringify(
					{
						globalFilter,
						sortKey,
						sortDirection,
						pageIndex: pageIndexForView,
						pageSize,
					},
					null,
					2,
				)}
			</pre>
		</div>
	);
}

function SortableHeader({
	label,
	sortKey,
	activeSortKey,
	sortDirection,
	onToggleSort,
}: {
	label: string;
	sortKey: SortKey;
	activeSortKey: SortKey;
	sortDirection: SortDirection;
	onToggleSort: (nextKey: SortKey) => void;
}) {
	const isActive = sortKey === activeSortKey;
	const indicator = isActive ? (sortDirection === "asc" ? " [asc]" : " [desc]") : "";

	return (
		<th className="px-4 py-3 text-left">
			<button
				type="button"
				onClick={() => onToggleSort(sortKey)}
				className="cursor-pointer transition-colors select-none hover:text-blue-400"
			>
				{label}
				{indicator}
			</button>
		</th>
	);
}

function getSortableValue(person: Person, sortKey: SortKey): string | number {
	if (sortKey === "id") {
		return person.id;
	}
	if (sortKey === "firstName") {
		return person.firstName;
	}
	if (sortKey === "lastName") {
		return person.lastName;
	}
	return fullName(person);
}

function compareValues(a: string | number, b: string | number) {
	if (typeof a === "number" && typeof b === "number") {
		return a - b;
	}
	return String(a).localeCompare(String(b));
}

function fullName(person: Person) {
	return `${person.firstName} ${person.lastName}`;
}
