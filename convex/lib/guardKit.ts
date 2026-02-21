import type { UserIdentity } from "convex/server";
import { z } from "zod";

import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { AppPermission, AppRole } from "../schemas";
import { getAuthUserId, throwForbidden, zMutation, zQuery, requireAuth } from "./functionHelpers";

type MaybePromise<T> = T | Promise<T>;
type ContextWithAuthAndDb = Pick<QueryCtx, "auth" | "db"> | Pick<MutationCtx, "auth" | "db">;
type RoleAndPermissionContext = Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">;
type RoleAndPermissionResolver = (
	ctx: RoleAndPermissionContext,
	identity: UserIdentity,
) => Promise<{
	role: AppRole;
	permissions: AppPermission[];
}>;
type ZodArgsShape = z.ZodRawShape;
type GuardArgs<TShape extends ZodArgsShape> = z.core.output<
	z.core.$ZodObject<TShape, z.core.$strict>
>;
let roleAndPermissionResolver: RoleAndPermissionResolver | null = null;

export type GuardActor = {
	identity: UserIdentity;
	userId: string;
	role: AppRole;
	permissions: AppPermission[];
};

type GuardAccessRule<TArgs> =
	| {
			type: "authenticated";
	  }
	| {
			type: "role";
			role: AppRole;
			message?: string;
	  }
	| {
			type: "allPermissions";
			permissions: readonly AppPermission[];
			message?: string;
	  }
	| {
			type: "anyPermission";
			permissions: readonly AppPermission[];
			message?: string;
	  }
	| {
			type: "roleOrPermissions";
			role: AppRole;
			permissions: readonly AppPermission[];
			mode?: "all" | "any";
			message?: string;
	  }
	| {
			type: "custom";
			check: (params: { actor: GuardActor; args: TArgs }) => MaybePromise<boolean>;
			message?: string;
	  };

type GuardAccess<TArgs> =
	| GuardAccessRule<TArgs>
	| ((params: {
			actor: GuardActor;
			args: TArgs;
	  }) => MaybePromise<GuardAccessRule<TArgs> | boolean>);

type GuardedQueryOptions<TShape extends ZodArgsShape, TResult> = {
	args: TShape;
	access?: GuardAccess<GuardArgs<TShape>>;
	handler: (ctx: QueryCtx, args: GuardArgs<TShape>, actor: GuardActor) => MaybePromise<TResult>;
};

type GuardedMutationOptions<TShape extends ZodArgsShape, TResult> = {
	args: TShape;
	access?: GuardAccess<GuardArgs<TShape>>;
	handler: (ctx: MutationCtx, args: GuardArgs<TShape>, actor: GuardActor) => MaybePromise<TResult>;
};

async function getRoleAndPermissionResolver(): Promise<RoleAndPermissionResolver> {
	if (roleAndPermissionResolver) {
		return roleAndPermissionResolver;
	}
	const authorization = await import("./authorization");
	roleAndPermissionResolver = authorization.getRoleAndPermissions;
	return roleAndPermissionResolver;
}

export async function getActor(
	ctx: {
		auth: ContextWithAuthAndDb["auth"];
		db: ContextWithAuthAndDb["db"];
	},
	options?: {
		resolveRoleAndPermissions?: RoleAndPermissionResolver;
	},
): Promise<GuardActor> {
	const identity = await requireAuth(ctx);
	const resolveRoleAndPermissions =
		options?.resolveRoleAndPermissions ?? (await getRoleAndPermissionResolver());
	const { role, permissions } = await resolveRoleAndPermissions(ctx, identity);
	return {
		identity,
		userId: getAuthUserId(identity),
		role,
		permissions,
	};
}

export function requireAllPermissions(
	actor: Pick<GuardActor, "permissions">,
	required: readonly AppPermission[],
	options?: { message?: string },
): void {
	const hasAll = required.every((permission) => actor.permissions.includes(permission));
	if (!hasAll) {
		throwForbidden(options?.message ?? "You do not have permission to perform this action");
	}
}

export function requireAnyPermission(
	actor: Pick<GuardActor, "permissions">,
	required: readonly AppPermission[],
	options?: { message?: string },
): void {
	const hasAny = required.some((permission) => actor.permissions.includes(permission));
	if (!hasAny) {
		throwForbidden(options?.message ?? "You do not have permission to perform this action");
	}
}

export function requireRoleOrPermissions(
	actor: Pick<GuardActor, "role" | "permissions">,
	options: {
		role: AppRole;
		permissions: readonly AppPermission[];
		mode?: "all" | "any";
		message?: string;
	},
): void {
	if (actor.role === options.role) {
		return;
	}

	if (options.mode === "all") {
		requireAllPermissions(actor, options.permissions, options);
		return;
	}

	requireAnyPermission(actor, options.permissions, options);
}

async function enforceAccess<TArgs>(
	actor: GuardActor,
	args: TArgs,
	access?: GuardAccess<TArgs>,
): Promise<void> {
	if (!access) {
		return;
	}

	const rule = typeof access === "function" ? await access({ actor, args }) : access;
	if (typeof rule === "boolean") {
		if (!rule) {
			throwForbidden("You do not have access to this resource");
		}
		return;
	}

	switch (rule.type) {
		case "authenticated":
			return;
		case "role":
			if (actor.role !== rule.role) {
				throwForbidden(rule.message ?? "You do not have the required role");
			}
			return;
		case "allPermissions":
			requireAllPermissions(actor, rule.permissions, rule);
			return;
		case "anyPermission":
			requireAnyPermission(actor, rule.permissions, rule);
			return;
		case "roleOrPermissions":
			requireRoleOrPermissions(actor, rule);
			return;
		case "custom": {
			const allowed = await rule.check({ actor, args });
			if (!allowed) {
				throwForbidden(rule.message ?? "You do not have access to this resource");
			}
			return;
		}
		default:
			rule satisfies never;
	}
}

export function guardedQuery<TShape extends ZodArgsShape, TResult>(
	options: GuardedQueryOptions<TShape, TResult>,
) {
	return zQuery({
		args: options.args,
		handler: async (ctx, args) => {
			const actor = await getActor(ctx);
			// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
			const guardedArgs = args as GuardArgs<TShape>;
			await enforceAccess(actor, guardedArgs, options.access);
			return options.handler(ctx, guardedArgs, actor);
		},
	});
}

export function guardedMutation<TShape extends ZodArgsShape, TResult>(
	options: GuardedMutationOptions<TShape, TResult>,
) {
	return zMutation({
		args: options.args,
		handler: async (ctx, args) => {
			const actor = await getActor(ctx);
			// oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
			const guardedArgs = args as GuardArgs<TShape>;
			await enforceAccess(actor, guardedArgs, options.access);
			return options.handler(ctx, guardedArgs, actor);
		},
	});
}
