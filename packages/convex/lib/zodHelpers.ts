import { withSystemFields, zodOutputToConvexFields } from "better-convex/server";
import { z } from "zod";

type TableSchema<TableName extends string, Fields extends z.ZodRawShape> = z.ZodObject<
	ReturnType<typeof withSystemFields<TableName, Fields>>
>;

export function zodToConvex<T extends z.ZodRawShape>(
	shape: z.ZodObject<
		T & {
			_id: z.ZodType;
			_creationTime: z.ZodNumber;
		}
	>,
) {
	return zodOutputToConvexFields(shape.omit({ _id: true, _creationTime: true } as const).shape);
}

export function zodTable<TableName extends string, Fields extends z.ZodRawShape>(
	tableName: TableName,
	fields: Fields,
): TableSchema<TableName, Fields> {
	return z.object(withSystemFields(tableName, fields));
}
