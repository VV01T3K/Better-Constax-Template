import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import type { AppPermission, AppRole, PermissionScope } from "@convex/schemas";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { flexRender, getCoreRowModel, type ColumnDef, useReactTable } from "@tanstack/react-table";
import { Loader2, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

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
				cell: ({ row }) => <Badge variant="secondary">{row.original.group}</Badge>,
			},
			{
				accessorKey: "action",
				header: "Type",
				cell: ({ row }) => (
					<Badge variant={row.original.action === "access" ? "outline" : "default"}>
						{row.original.action}
					</Badge>
				),
			},
			{
				accessorKey: "label",
				header: "Permission",
				cell: ({ row }) => (
					<div className="min-w-80 space-y-1">
						<p className="font-semibold text-foreground">{row.original.label}</p>
						<p className="text-xs text-muted-foreground">{row.original.key}</p>
						<p className="text-xs text-muted-foreground">{row.original.description}</p>
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
							<Checkbox
								checked={checked}
								disabled={readOnly}
								onCheckedChange={() => togglePermission(role, row.original.key)}
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
		<div className="p-6">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
				<Card>
					<CardHeader>
						<div className="flex flex-wrap items-start justify-between gap-4">
							<div>
								<CardTitle className="flex items-center gap-2">
									<ShieldCheck className="size-5" />
									{title}
								</CardTitle>
								<CardDescription>{description}</CardDescription>
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<Button
									type="button"
									variant="outline"
									disabled={!dirty || isSaving}
									onClick={() => setDraftMatrix(cloneMatrix(baselineMatrix))}
								>
									<RotateCcw size={16} />
									Discard
								</Button>
								<Button
									type="button"
									disabled={!dirty || isSaving}
									onClick={() => {
										void updateMatrixMutation.mutateAsync({
											scope,
											matrix: draftMatrix,
										});
									}}
								>
									{isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
									Save
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex flex-wrap gap-2">
							<Button asChild variant={scope === "app" ? "default" : "outline"} size="sm">
								<Link to="/admin/permissions">App Permissions</Link>
							</Button>
							<Button asChild variant={scope === "admin" ? "default" : "outline"} size="sm">
								<Link to="/admin/permissions/admin">Admin Permissions</Link>
							</Button>
						</div>

						<Input
							type="text"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Search by key, label, description, domain, or type..."
						/>

						{serverError ? (
							<Alert variant="destructive">
								<AlertDescription>{serverError}</AlertDescription>
							</Alert>
						) : null}
					</CardContent>
				</Card>

				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.header, header.getContext())}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="text-center text-muted-foreground">
									No permissions match your search.
								</TableCell>
							</TableRow>
						) : (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} className="align-top">
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
