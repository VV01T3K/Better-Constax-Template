import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
	adminListUsersResponseSchema,
	appRoles,
	isAppRole,
	normalizeRole,
	type AppRole,
	type AuthUserId,
} from "@convex/schemas";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { flexRender, getCoreRowModel, type ColumnDef, useReactTable } from "@tanstack/react-table";
import { Loader2, ShieldCheck, UserCog } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select as UiSelect,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import { waitForImpersonationState } from "@/lib/impersonation-client";

type AdminUserRow = {
	id: AuthUserId;
	name: string;
	email: string;
	role: AppRole;
	banned: boolean;
	createdAt: Date | null;
};

const ROLE_ITEMS = appRoles.map((role) => ({ label: role, value: role }));

export const Route = createFileRoute("/_authenticated/admin/users")({
	beforeLoad: async ({ context }) => {
		const allowed = await context.queryClient.fetchQuery({
			...convexQuery(api.functions.authorization.hasPermission, {
				permission: "admin.users.access",
			}),
			staleTime: 0,
		});
		if (!allowed) throw redirect({ to: "/forbidden" });
	},
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			convexQuery(api.functions.authorization.getMyAccess, {}),
		);
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
				<div className="min-w-52">
					<p className="font-semibold text-foreground">{row.original.name}</p>
					<p className="text-xs text-muted-foreground">{row.original.email}</p>
				</div>
			),
		},
		{
			accessorKey: "role",
			header: "Role",
			cell: ({ row }) => {
				const role = row.original.role;
				const variant = role === "admin" ? "default" : role === "manager" ? "secondary" : "outline";
				return <Badge variant={variant}>{role}</Badge>;
			},
		},
		{
			id: "status",
			header: "Status",
			cell: ({ row }) =>
				row.original.banned ? <Badge variant="destructive">banned</Badge> : <Badge variant="secondary">active</Badge>,
		},
		{
			accessorKey: "createdAt",
			header: "Created",
			cell: ({ row }) => (
				<span className="text-xs text-muted-foreground">
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
						<UiSelect
							items={ROLE_ITEMS}
							value={user.role}
							disabled={!canEditRoles || busy}
							onValueChange={(nextRoleValue) => {
								if (!nextRoleValue || !isAppRole(nextRoleValue)) {
									return;
								}

								const nextRole = nextRoleValue;
								if (self && user.role === "admin" && nextRole !== "admin") {
									setActionError("You cannot remove your own admin role.");
									return;
								}

								void roleMutation.mutateAsync({ userId: user.id, role: nextRole });
							}}
						>
							<SelectTrigger className="w-28">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{ROLE_ITEMS.map((roleItem) => (
										<SelectItem key={roleItem.value} value={roleItem.value}>
											{roleItem.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</UiSelect>
						<Button
							type="button"
							size="sm"
							disabled={!canImpersonate || targetIsAdmin || self || busy}
							onClick={() => {
								void impersonateMutation.mutateAsync({ userId: user.id });
							}}
						>
							Impersonate
						</Button>
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
		<div className="p-6">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
				<Card>
					<CardHeader>
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<CardTitle className="flex items-center gap-2">
									<UserCog className="size-5" />
									Admin User Management
								</CardTitle>
								<CardDescription>
									Assign roles and start guarded impersonation sessions for non-admin users.
								</CardDescription>
							</div>
							<div className="text-sm text-muted-foreground">
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
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2">
							<Badge variant="secondary">Role edits: {canEditRoles ? "on" : "off"}</Badge>
							<Badge variant="secondary">Impersonation: {canImpersonate ? "on" : "off"}</Badge>
						</div>
					</CardContent>
				</Card>

				{actionError ? (
					<Alert variant="destructive">
						<AlertDescription>{actionError}</AlertDescription>
					</Alert>
				) : null}

				{usersQuery.isLoading ? (
					<Card>
						<CardContent className="space-y-2 pt-6">
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-8 w-full" />
						</CardContent>
					</Card>
				) : usersQuery.isError ? (
					<Alert variant="destructive">
						<AlertDescription>
							Failed to load users: {usersQuery.error instanceof Error ? usersQuery.error.message : "Unknown error"}
						</AlertDescription>
					</Alert>
				) : (
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
									<TableCell colSpan={columns.length} className="text-center text-muted-foreground">
										No users found.
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
				)}

				<Alert>
					<ShieldCheck className="size-4" />
					<AlertDescription>
						Impersonation is blocked for admin targets and sessions expire after 15 minutes.
					</AlertDescription>
				</Alert>
			</div>
		</div>
	);
}
