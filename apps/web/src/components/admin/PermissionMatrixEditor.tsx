import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import type { AppPermission, AppRole, PermissionScope } from "@repo/backend/convex/schemas";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { flexRender, getCoreRowModel, type ColumnDef, useReactTable } from "@tanstack/react-table";
import { Loader2, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Matrix = Record<AppRole, AppPermission[]>;

type PermissionRow = {
	key: AppPermission;
	label: string;
	description: string;
	group: string;
	action: "access" | "mutate";
};

const editableRoles: readonly AppRole[] = ["user", "manager"];

function cloneMatrix(matrix: Matrix): Matrix {
	return {
		user: [...matrix.user],
		manager: [...matrix.manager],
		admin: [...matrix.admin],
	};
}

function normalize(list: readonly AppPermission[]): AppPermission[] {
	return [...new Set(list)].toSorted();
}

function isMatrixEqual(left: Matrix, right: Matrix): boolean {
	return (["user", "manager", "admin"] as const).every((role) => {
		const leftRole = normalize(left[role]);
		const rightRole = normalize(right[role]);
		if (leftRole.length !== rightRole.length) {
			return false;
		}
		return leftRole.every((permission, index) => permission === rightRole[index]);
	});
}

export function PermissionMatrixEditor({
	scope,
	title,
	description,
}: {
	scope: PermissionScope;
	title: string;
	description: string;
}) {
	const permissionsQuery = convexQuery(api.functions.authorization.getCatalogAndMatrix, { scope });
	const { data } = useSuspenseQuery(permissionsQuery);
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [serverError, setServerError] = useState<string | null>(null);
	const [baselineMatrix, setBaselineMatrix] = useState<Matrix>(cloneMatrix(data.matrix));
	const [draftMatrix, setDraftMatrix] = useState<Matrix>(cloneMatrix(data.matrix));

	useEffect(() => {
		setBaselineMatrix(cloneMatrix(data.matrix));
		setDraftMatrix(cloneMatrix(data.matrix));
	}, [data.matrix]);

	const updateMatrixMutation = useMutation({
		mutationFn: useConvexMutation(api.functions.authorization.updateMatrix),
		onSuccess: async (response: { matrix: Matrix }) => {
			setServerError(null);
			setBaselineMatrix(cloneMatrix(response.matrix));
			setDraftMatrix(cloneMatrix(response.matrix));
			await queryClient.invalidateQueries({ queryKey: permissionsQuery.queryKey });
		},
		onError: (error) => {
			setServerError(error instanceof Error ? error.message : "Failed to save permission matrix");
		},
	});

	const rows = useMemo<PermissionRow[]>(() => {
		const query = search.trim().toLowerCase();
		return data.catalog
			.filter((item) => {
				if (!query) {
					return true;
				}
				return (
					item.key.toLowerCase().includes(query) ||
					item.label.toLowerCase().includes(query) ||
					item.description.toLowerCase().includes(query) ||
					item.group.toLowerCase().includes(query) ||
					item.action.toLowerCase().includes(query)
				);
			})
			.map((item) => ({
				key: item.key,
				label: item.label,
				description: item.description,
				group: item.group,
				action: item.action,
			}));
	}, [data.catalog, search]);

	const togglePermission = (role: AppRole, permission: AppPermission) => {
		if (!editableRoles.includes(role)) {
			return;
		}

		setDraftMatrix((previous) => {
			const current = new Set(previous[role]);
			if (current.has(permission)) {
				current.delete(permission);
			} else {
				current.add(permission);
			}

			return {
				...previous,
				[role]: [...current],
			};
		});
	};

	const dirty = !isMatrixEqual(draftMatrix, baselineMatrix);
	const isSaving = updateMatrixMutation.isPending;

	const columns = useMemo<ColumnDef<PermissionRow>[]>(
		() => [
			{
				accessorKey: "group",
				header: "Domain",
				cell: ({ row }) => (
					<span className="rounded-full border border-slate-600 bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-200">
						{row.original.group}
					</span>
				),
			},
			{
				accessorKey: "action",
				header: "Type",
				cell: ({ row }) => (
					<span
						className={`rounded-full px-2 py-1 text-xs font-semibold ${
							row.original.action === "access"
								? "bg-emerald-900/60 text-emerald-200"
								: "bg-amber-900/60 text-amber-200"
						}`}
					>
						{row.original.action}
					</span>
				),
			},
			{
				accessorKey: "label",
				header: "Permission",
				cell: ({ row }) => (
					<div className="min-w-80">
						<p className="font-semibold text-slate-100">{row.original.label}</p>
						<p className="text-xs text-slate-400">{row.original.key}</p>
						<p className="mt-1 text-xs text-slate-300">{row.original.description}</p>
					</div>
				),
			},
			...(["user", "manager", "admin"] as const).map((role) => ({
				id: role,
				header: role[0].toUpperCase() + role.slice(1),
				cell: ({ row }: { row: { original: PermissionRow } }) => {
					const checked = draftMatrix[role].includes(row.original.key);
					const readOnly = role === "admin";
					return (
						<div className="flex justify-center">
							<input
								type="checkbox"
								checked={checked}
								disabled={readOnly}
								onChange={() => togglePermission(role, row.original.key)}
								className="h-4 w-4 accent-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
								aria-label={`${role} has ${row.original.key}`}
							/>
						</div>
					);
				},
			})),
		],
		[draftMatrix],
	);

	const table = useReactTable({
		data: rows,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div className="min-h-screen bg-[radial-gradient(circle_at_top,#111827_0%,#020617_55%,#020617_100%)] p-6 text-slate-100">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
				<div className="rounded-2xl border border-slate-700/70 bg-slate-900/85 p-5 shadow-2xl shadow-black/30 backdrop-blur">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div>
							<h1 className="flex items-center gap-2 text-2xl font-bold">
								<ShieldCheck className="h-6 w-6 text-cyan-300" />
								{title}
							</h1>
							<p className="mt-1 max-w-3xl text-sm text-slate-300">{description}</p>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<button
								type="button"
								disabled={!dirty || isSaving}
								onClick={() => setDraftMatrix(cloneMatrix(baselineMatrix))}
								className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<RotateCcw size={16} />
								Discard
							</button>
							<button
								type="button"
								disabled={!dirty || isSaving}
								onClick={() => {
									void updateMatrixMutation.mutateAsync({
										scope,
										matrix: draftMatrix,
									});
								}}
								className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
								Save
							</button>
						</div>
					</div>

					<div className="mt-4 flex flex-wrap gap-2">
						<Link
							to="/admin/permissions"
							className={`rounded-lg border px-3 py-2 text-xs font-semibold tracking-wide uppercase transition-colors ${
								scope === "app"
									? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
									: "border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700"
							}`}
						>
							App Permissions
						</Link>
						<Link
							to="/admin/permissions/admin"
							className={`rounded-lg border px-3 py-2 text-xs font-semibold tracking-wide uppercase transition-colors ${
								scope === "admin"
									? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
									: "border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700"
							}`}
						>
							Admin Permissions
						</Link>
					</div>

					<div className="mt-4">
						<input
							type="text"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Search by key, label, description, domain, or type..."
							className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 ring-cyan-400 outline-none focus:ring"
						/>
					</div>

					{serverError ? (
						<div className="mt-3 rounded-lg border border-rose-800/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
							{serverError}
						</div>
					) : null}
				</div>

				<div className="overflow-x-auto rounded-2xl border border-slate-700/70 bg-slate-900/85 shadow-xl shadow-black/30">
					<table className="w-full text-sm">
						<thead className="bg-slate-950/70">
							{table.getHeaderGroups().map((headerGroup) => (
								<tr key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<th
											key={header.id}
											className="px-4 py-3 text-left font-semibold text-slate-200"
										>
											{header.isPlaceholder
												? null
												: flexRender(header.column.columnDef.header, header.getContext())}
										</th>
									))}
								</tr>
							))}
						</thead>
						<tbody>
							{table.getRowModel().rows.length === 0 ? (
								<tr>
									<td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
										No permissions match your search.
									</td>
								</tr>
							) : (
								table.getRowModel().rows.map((row) => (
									<tr key={row.id} className="border-t border-slate-800">
										{row.getVisibleCells().map((cell) => (
											<td key={cell.id} className="px-4 py-3 align-top text-slate-300">
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</td>
										))}
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
