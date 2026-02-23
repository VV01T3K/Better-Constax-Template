import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
	adminListUsersResponseSchema,
	appRoles,
	isAppRole,
	normalizeRole,
	type AuthUserId,
	type AppRole,
} from "@convex/schemas";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { flexRender, getCoreRowModel, type ColumnDef, useReactTable } from "@tanstack/react-table";
import { Loader2, ShieldCheck, UserCog } from "lucide-react";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { waitForImpersonationState } from "@/lib/impersonation-client";
import { protectedRouteLoader } from "@/lib/route-guard-kit";

type AdminUserRow = {
	id: AuthUserId;
	name: string;
	email: string;
	role: AppRole;
	banned: boolean;
	createdAt: Date | null;
};

export const Route = createFileRoute("/admin/users")({
	loader: async ({ context, location }) => {
		await protectedRouteLoader({
			queryClient: context.queryClient,
			permission: "admin.users.access",
			redirectHref: location.href,
			prefetch: () =>
				context.queryClient.ensureQueryData(
					convexQuery(api.functions.authorization.getMyAccess, {}),
				),
		});
	},
	component: AdminUsersPage,
});

async function fetchAdminUsers(): Promise<{ rows: AdminUserRow[]; total: number }> {
	const response = await authClient.admin.listUsers({
		query: {},
	});
	if (response.error) {
		throw new Error(response.error.message ?? "Failed to fetch users");
	}

	const parsedPayload = adminListUsersResponseSchema.safeParse(response.data ?? {});
	if (!parsedPayload.success) {
		throw new Error("Received an invalid users response from auth server");
	}
	const users = parsedPayload.data.users;

	return {
		rows: users.map((user) => ({
			id: user.id,
			name: user.name ?? "Unknown user",
			email: user.email ?? "No email",
			role: normalizeRole(user.role),
			banned: Boolean(user.banned),
			createdAt: user.createdAt ? new Date(user.createdAt) : null,
		})),
		total: parsedPayload.data.total ?? users.length,
	};
}

function AdminUsersPage() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: myAccess } = useSuspenseQuery(
		convexQuery(api.functions.authorization.getMyAccess, {}),
	);
	const { data: currentUser } = useSuspenseQuery(convexQuery(api.auth.getCurrentUser, {}));
	const { data: authSession, refetch: refetchSession } = authClient.useSession();
	const [actionError, setActionError] = useState<string | null>(null);

	const canEditRoles = myAccess?.permissions.includes("admin.users.roles.mutate") ?? false;
	const canImpersonate =
		myAccess?.permissions.includes("admin.users.impersonation.mutate") ?? false;
	const selfUserId = authSession?.user.id ?? currentUser?.subject ?? null;

	const usersQuery = useQuery({
		queryKey: ["admin-users"],
		queryFn: fetchAdminUsers,
	});

	const startAuditMutation = useMutation({
		mutationFn: useConvexMutation(api.functions.impersonationAudit.start),
	});
	const cancelStartAuditMutation = useMutation({
		mutationFn: useConvexMutation(api.functions.impersonationAudit.cancelStart),
	});

	const roleMutation = useMutation({
		mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
			await authClient.$fetch("/admin/set-role", {
				method: "POST",
				body: { userId, role },
			});
		},
		onSuccess: async () => {
			setActionError(null);
			await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
			await router.invalidate();
		},
		onError: (error) => {
			setActionError(error instanceof Error ? error.message : "Failed to update role");
		},
	});

	const impersonateMutation = useMutation({
		mutationFn: async ({ userId }: { userId: AuthUserId }) => {
			let auditId: Id<"impersonationAudit"> | null = null;
			try {
				auditId = await startAuditMutation.mutateAsync({
					targetUserId: userId,
					source: "admin-users-page",
				});

				const result = await authClient.admin.impersonateUser({
					userId,
				});
				if (result.error) {
					throw new Error(result.error.message ?? "Failed to impersonate user");
				}
			} catch (cause) {
				if (auditId) {
					await cancelStartAuditMutation.mutateAsync({ auditId }).catch(() => undefined);
				}
				throw cause;
			}
		},
		onSuccess: async () => {
			setActionError(null);
			await queryClient.cancelQueries();
			await router.navigate({ to: "/", replace: true });

			const switched = await waitForImpersonationState({
				expectedImpersonating: true,
				refetchSession,
			});

			if (!switched) {
				window.location.assign("/");
				return;
			}

			queryClient.clear();
			await router.invalidate();
		},
		onError: (error) => {
			setActionError(error instanceof Error ? error.message : "Failed to impersonate user");
		},
	});

	const rows = usersQuery.data?.rows ?? [];
	const total = usersQuery.data?.total ?? rows.length;
	const busy = roleMutation.isPending || impersonateMutation.isPending;

	const columns: ColumnDef<AdminUserRow>[] = [
		{
			accessorKey: "name",
			header: "User",
			cell: ({ row }) => (
				<div>
					<p className="font-semibold text-slate-900">{row.original.name}</p>
					<p className="text-xs text-slate-600">{row.original.email}</p>
				</div>
			),
		},
		{
			accessorKey: "role",
			header: "Role",
			cell: ({ row }) => (
				<span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">
					{row.original.role}
				</span>
			),
		},
		{
			accessorKey: "createdAt",
			header: "Created",
			cell: ({ row }) => (
				<span className="text-xs text-slate-600">
					{row.original.createdAt ? row.original.createdAt.toLocaleDateString() : "Unknown"}
				</span>
			),
		},
		{
			id: "actions",
			header: "Actions",
			cell: ({ row }) => {
				const user = row.original;
				const self = selfUserId === user.id;
				const targetIsAdmin = user.role === "admin";
				return (
					<div className="flex flex-wrap items-center gap-2">
						<select
							value={user.role}
							disabled={!canEditRoles || busy}
							onChange={(event) => {
								const nextRoleValue = event.target.value;
								if (!isAppRole(nextRoleValue)) {
									return;
								}

								const nextRole = nextRoleValue;
								if (self && user.role === "admin" && nextRole !== "admin") {
									setActionError("You cannot remove your own admin role.");
									return;
								}

								void roleMutation.mutateAsync({ userId: user.id, role: nextRole });
							}}
							className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{appRoles.map((role) => (
								<option key={role} value={role}>
									{role}
								</option>
							))}
						</select>
						<button
							type="button"
							disabled={!canImpersonate || targetIsAdmin || self || busy}
							onClick={() => {
								void impersonateMutation.mutateAsync({ userId: user.id });
							}}
							className="rounded-md bg-cyan-600 px-2 py-1 text-xs font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-40"
						>
							Impersonate
						</button>
					</div>
				);
			},
		},
	];

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
								<UserCog className="h-6 w-6 text-cyan-700" />
								Admin User Management
							</h1>
							<p className="mt-1 text-sm text-slate-600">
								Assign roles and start guarded impersonation sessions for non-admin users.
							</p>
						</div>
						<div className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
							{usersQuery.isFetching ? (
								<span className="inline-flex items-center gap-2">
									<Loader2 size={14} className="animate-spin" />
									Refreshing users...
								</span>
							) : (
								<span>{total} users</span>
							)}
						</div>
					</div>

					<div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
						<span className="rounded-full bg-slate-100 px-2 py-1">
							Role edits: {canEditRoles ? "on" : "off"}
						</span>
						<span className="rounded-full bg-slate-100 px-2 py-1">
							Impersonation: {canImpersonate ? "on" : "off"}
						</span>
					</div>

					{actionError ? (
						<div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
							{actionError}
						</div>
					) : null}
				</div>

				{usersQuery.isLoading ? (
					<div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
						Loading users...
					</div>
				) : usersQuery.isError ? (
					<div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
						Failed to load users:{" "}
						{usersQuery.error instanceof Error ? usersQuery.error.message : "Unknown error"}
					</div>
				) : (
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
								{table.getRowModel().rows.length === 0 ? (
									<tr>
										<td
											colSpan={columns.length}
											className="px-4 py-8 text-center text-sm text-slate-500"
										>
											No users found.
										</td>
									</tr>
								) : (
									table.getRowModel().rows.map((row) => (
										<tr key={row.id} className="border-t border-slate-100">
											{row.getVisibleCells().map((cell) => (
												<td key={cell.id} className="px-4 py-3 align-top text-slate-700">
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</td>
											))}
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				)}

				<div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm">
					<p className="flex items-center gap-2">
						<ShieldCheck size={14} className="text-cyan-700" />
						Impersonation is blocked for admin targets and sessions expire after 15 minutes.
					</p>
				</div>
			</div>
		</div>
	);
}
