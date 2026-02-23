import { zodToConvexFields } from "convex-helpers/server/zod4";
import { defineSchema, defineTable } from "convex/server";

import {
	addressFormSubmissionSchema,
	fileSchema,
	impersonationAuditSchema,
	profileSchema,
	rolePermissionSchema,
	todoSchema,
} from "./schemas";

export default defineSchema({
	profiles: defineTable(zodToConvexFields(profileSchema.shape)).index("by_authUserId", [
		"authUserId",
	]),
	todos: defineTable(zodToConvexFields(todoSchema.shape)).index("by_authUserId", ["authUserId"]),
	files: defineTable(zodToConvexFields(fileSchema.shape)).index("by_authUserId", ["authUserId"]),
	addressSubmissions: defineTable(zodToConvexFields(addressFormSubmissionSchema.shape)).index(
		"by_authUserId",
		["authUserId"],
	),
	rolePermissions: defineTable(zodToConvexFields(rolePermissionSchema.shape)).index("by_role", [
		"role",
	]),
	impersonationAudit: defineTable(zodToConvexFields(impersonationAuditSchema.shape))
		.index("by_actorUserId_startedAt", ["actorUserId", "startedAt"])
		.index("by_targetUserId_startedAt", ["targetUserId", "startedAt"]),
});
