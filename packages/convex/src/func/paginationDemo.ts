import { authMiddleware, c } from "../../lib/crpc";
import {
	PAGINATION_DEMO_PAGE_SIZE,
	paginationDemoListItemSchema,
	paginationDemoSchema,
} from "../../shared/schemas/pagination-demo";

export const list = c.query
	.meta({ auth: "required" })
	.use(authMiddleware)
	.paginated({
		limit: PAGINATION_DEMO_PAGE_SIZE,
		item: paginationDemoListItemSchema,
	})
	.output(paginationDemoSchema.list.output)
	.query(async ({ ctx, input }) => {
		return await ctx.db.query("paginationDemoItems").withIndex("by_position").paginate({
			cursor: input.cursor,
			numItems: input.limit,
		});
	});
