import type { UserIdentity } from "convex/server";
import { describe, expect, it, vi } from "vitest";

import type { QueryCtx } from "../_generated/server";
import type { AppPermission, AppRole } from "../schemas";

const getRoleAndPermissionsMock = vi.fn(
	async (_ctx: unknown, identity: UserIdentity & { role?: AppRole }) => {
		const role = identity.role ?? "user";
		const permissions: AppPermission[] =
			role === "admin"
				? ["admin.users.access", "admin.permissions.admin.access"]
				: ["demo.todos.access"];
		return { role, permissions };
	},
);

vi.mock("./functionHelpers", () => {
	return {
		requireAuth: async (ctx: Pick<QueryCtx, "auth">) => {
			const identity = await ctx.auth.getUserIdentity();
			if (!identity) {
				throw new Error("Authentication required");
			}
			return identity;
		},
		getAuthUserId: (identity: UserIdentity) => identity.subject,
		throwForbidden: (message = "You do not have access to this resource"): never => {
			throw new Error(message);
		},
		zQuery: <T>(definition: T) => definition,
		zMutation: <T>(definition: T) => definition,
	};
});

const { getActor, requireAllPermissions, requireAnyPermission, requireRoleOrPermissions } =
	await import("./guard-kit");

function makeIdentity(role?: AppRole): UserIdentity & { role?: AppRole } {
	return {
		tokenIdentifier: "https://issuer|user-1",
		subject: "user-1",
		issuer: "https://issuer",
		role,
	};
}

function makeCtx(options: {
	identity: (UserIdentity & { role?: AppRole }) | null;
	rows?: Array<{ role: AppRole; permissions: AppPermission[] }>;
}): Pick<QueryCtx, "auth" | "db"> {
	const ctx = {
		auth: {
			getUserIdentity: async () => options.identity,
		},
		db: {
			query: () => ({
				collect: async () => options.rows ?? [],
			}),
		},
	};
	// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
	return ctx as unknown as Pick<QueryCtx, "auth" | "db">;
}

function makeActor(overrides?: Partial<{ role: AppRole; permissions: AppPermission[] }>) {
	return {
		role: overrides?.role ?? "user",
		permissions: overrides?.permissions ?? [],
	};
}

describe("guard-kit", () => {
	it("returns actor for authenticated user", async () => {
		const actor = await getActor(
			makeCtx({
				identity: makeIdentity("admin"),
			}),
			{
				resolveRoleAndPermissions: getRoleAndPermissionsMock,
			},
		);

		expect(actor.userId).toBe("user-1");
		expect(actor.role).toBe("admin");
		expect(actor.permissions).toEqual(
			expect.arrayContaining(["admin.users.access", "admin.permissions.admin.access"]),
		);
	});

	it("throws for unauthenticated user", async () => {
		await expect(
			getActor(
				makeCtx({
					identity: null,
				}),
				{
					resolveRoleAndPermissions: getRoleAndPermissionsMock,
				},
			),
		).rejects.toThrow("Authentication required");
	});

	it("validates any-permission checks", () => {
		const actor = makeActor({
			permissions: ["demo.todos.access"],
		});

		expect(() =>
			requireAnyPermission(actor, ["demo.todos.access", "admin.users.access"]),
		).not.toThrow();
		expect(() =>
			requireAnyPermission(actor, ["admin.users.access"], {
				message: "missing any permission",
			}),
		).toThrow("missing any permission");
	});

	it("validates all-permission checks", () => {
		const actor = makeActor({
			permissions: ["demo.todos.access", "demo.todos.mutate"],
		});

		expect(() =>
			requireAllPermissions(actor, ["demo.todos.access", "demo.todos.mutate"]),
		).not.toThrow();
		expect(() =>
			requireAllPermissions(actor, ["demo.todos.access", "admin.users.access"], {
				message: "missing all permissions",
			}),
		).toThrow("missing all permissions");
	});

	it("validates role-or-permission checks", () => {
		expect(() =>
			requireRoleOrPermissions(makeActor({ role: "admin" }), {
				role: "admin",
				permissions: ["admin.users.access"],
			}),
		).not.toThrow();

		expect(() =>
			requireRoleOrPermissions(
				makeActor({
					role: "user",
					permissions: ["admin.users.access"],
				}),
				{
					role: "admin",
					permissions: ["admin.users.access"],
					mode: "any",
				},
			),
		).not.toThrow();

		expect(() =>
			requireRoleOrPermissions(makeActor({ role: "user" }), {
				role: "admin",
				permissions: ["admin.users.access"],
				mode: "any",
				message: "missing role or permission",
			}),
		).toThrow("missing role or permission");
	});
});
