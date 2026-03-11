export const PAGINATION_DEMO_SEED_COUNT = 10_000;
export const PAGINATION_DEMO_PAGE_SIZE = 200;
export const PAGINATION_DEMO_PAGE_SIZE_OPTIONS = [50, 100, 200, 500, 1000, 2000] as const;

export type PaginationDemoPageSize = (typeof PAGINATION_DEMO_PAGE_SIZE_OPTIONS)[number];
