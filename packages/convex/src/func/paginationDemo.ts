import { authMiddleware, c } from "../../lib/crpc";
import {
	PAGINATION_DEMO_PAGE_SIZE,
	PAGINATION_DEMO_SEED_COUNT,
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

export const listPage = c.query
	.meta({ auth: "required" })
	.use(authMiddleware)
	.input(paginationDemoSchema.listPage.input)
	.output(paginationDemoSchema.listPage.output)
	.query(async ({ ctx, input }) => {
		const totalPages = Math.max(1, Math.ceil(PAGINATION_DEMO_SEED_COUNT / input.pageSize));
		const pageIndex = Math.min(input.page, totalPages - 1);
		const start = pageIndex * input.pageSize;
		const end = start + input.pageSize;

		const page = await ctx.db
			.query("paginationDemoItems")
			.withIndex("by_position", (q) => q.gte("position", start).lt("position", end))
			.take(input.pageSize);

		return {
			page,
			pageIndex,
			pageSize: input.pageSize,
			totalPages,
			totalRows: PAGINATION_DEMO_SEED_COUNT,
		};
	});
