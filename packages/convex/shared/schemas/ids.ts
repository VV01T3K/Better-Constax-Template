import type { GenericId } from "convex/values";
import { z } from "zod";

import type { TableNames } from "../../src/_generated/dataModel";

export type ConvexEntityName = TableNames | "_storage";
export type Id<T extends ConvexEntityName> = GenericId<T>;

const formatEntityLabel = (entityName: ConvexEntityName) => {
	if (entityName === "_storage") return "storage";
	return entityName.endsWith("s") ? entityName.slice(0, -1) : entityName;
};

export const createIdSchema = <T extends ConvexEntityName>(entityName: T) =>
	z.custom<Id<T>>((value) => typeof value === "string", {
		message: `Expected a ${formatEntityLabel(entityName)} ID`,
	});

export const storageIdSchema = createIdSchema("_storage");
export const sessionIdSchema = createIdSchema("session");
export const userIdSchema = createIdSchema("user");
export const todoIdSchema = createIdSchema("todos");
export const fileIdSchema = createIdSchema("files");

export const parseId = <T extends ConvexEntityName>(entityName: T, value: unknown): Id<T> =>
	createIdSchema(entityName).parse(value);
