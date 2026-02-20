import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import type { AppPermission, AppRole } from "@convex/schemas";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { flexRender, getCoreRowModel, type ColumnDef, useReactTable } from "@tanstack/react-table";
import { Loader2, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { requireRoutePermission } from "@/lib/route-guards";

type Matrix = Record<AppRole, AppPermission[]>;

type PermissionRow = {
	key: AppPermission;
	label: string;
	description: string;
	group: "Demos" | "Admin";
};

const editableRoles: readonly AppRole[] = ["user", "manager"];

export const Route = createFileRoute("/admin/permissions")({
	loader: async ({ context, location }) => {
		await requireRoutePermission({
			queryClient: context.queryClient,
			permission: "admin.permissions.view",
			redirectHref: location.href,
		});
		await context.queryClient.ensureQueryData(
			convexQuery(api.functions.authorization.getCatalogAndMatrix, {}),
		);
	},
	component: PermissionsAdminPage,
});

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

function PermissionsAdminPage() {
	const permissionsQuery = convexQuery(api.functions.authorization.getCatalogAndMatrix, {});
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
		return data.catalog
			.filter((item) => {
				const query = search.trim().toLowerCase();
				if (!query) {
					return true;
				}
				return (
					item.key.toLowerCase().includes(query) ||
					item.label.toLowerCase().includes(query) ||
					item.description.toLowerCase().includes(query) ||
					item.group.toLowerCase().includes(query)
				);
			})
			.map((item) => ({
				key: item.key,
				label: item.label,
				description: item.description,
				group: item.group,
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
				header: "Group",
				cell: ({ row }) => (
					<span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">
						{row.original.group}
					</span>
				),
			},
			{
				accessorKey: "label",
				header: "Permission",
				cell: ({ row }) => (
					<div className="min-w-72">
						<p className="font-semibold text-slate-900">{row.original.label}</p>
						<p className="text-xs text-slate-500">{row.original.key}</p>
						<p className="mt-1 text-xs text-slate-600">{row.original.description}</p>
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
								className="h-4 w-4 accent-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
								aria-label={`${role} can access ${row.original.key}`}
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
		<div className="min-h-screen bg-slate-100 p-6">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
				<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
								<ShieldCheck className="h-6 w-6 text-cyan-700" />
								Role Permission Matrix
							</h1>
							<p className="mt-1 text-sm text-slate-600">
								Update role permissions for app features. Admin permissions are always enabled.
							</p>
						</div>
						<div className="flex items-center gap-2">
							<button
								type="button"
								disabled={!dirty || isSaving}
								onClick={() => setDraftMatrix(cloneMatrix(baselineMatrix))}
								className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<RotateCcw size={16} />
								Discard
							</button>
							<button
								type="button"
								disabled={!dirty || isSaving}
								onClick={() => {
									void updateMatrixMutation.mutateAsync({
										matrix: draftMatrix,
									});
								}}
								className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
								Save
							</button>
						</div>
					</div>

					<div className="mt-4">
						<input
							type="text"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Search permissions..."
							className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 ring-cyan-300 outline-none focus:ring"
						/>
					</div>

					{serverError ? (
						<div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
							{serverError}
						</div>
					) : null}
				</div>

				<div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
					<table className="w-full text-sm">
						<thead className="bg-slate-50">
							{table.getHeaderGroups().map((headerGroup) => (
								<tr key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<th
											key={header.id}
											className="px-4 py-3 text-left font-semibold text-slate-700"
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
							{table.getRowModel().rows.map((row) => (
								<tr key={row.id} className="border-t border-slate-100">
									{row.getVisibleCells().map((cell) => (
										<td key={cell.id} className="px-4 py-3 align-top text-slate-700">
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
