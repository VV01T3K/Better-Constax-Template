import { zodToConvexFields } from "convex-helpers/server/zod4";
import { v } from "convex/values";

import { addressSubmissionShape, fileShape, todoShape } from "../../src/lib/schemas";

export const todoTableFields = {
	...zodToConvexFields(todoShape),
	ownerUserId: v.id("user"),
};

export const fileTableFields = {
	...zodToConvexFields(fileShape),
	storageId: v.id("_storage"),
	ownerUserId: v.id("user"),
};

export const addressSubmissionTableFields = {
	...zodToConvexFields(addressSubmissionShape),
	ownerUserId: v.id("user"),
};
