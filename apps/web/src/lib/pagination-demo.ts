import {
	PAGINATION_DEMO_PAGE_SIZE,
	PAGINATION_DEMO_PAGE_SIZE_OPTIONS,
	PAGINATION_DEMO_SEED_COUNT,
	type PaginationDemoPageSize,
} from "@repo/convex/schemas/pagination-demo.constants";

export type PaginationPagedSearch = {
	page: number;
	pageSize: PaginationDemoPageSize;
};

export type PaginationInfiniteSearch = {
	pageSize: PaginationDemoPageSize;
};

export const PAGINATION_DEMO_PAGE_QUERY_STALE_TIME_MS = 30_000;

const paginationPageSizes = new Set<number>(PAGINATION_DEMO_PAGE_SIZE_OPTIONS);

export function isPaginationDemoPageSize(value: number): value is PaginationDemoPageSize {
	return paginationPageSizes.has(value);
}

export function getPaginationDemoTotalPages(pageSize: number) {
	return Math.max(1, Math.ceil(PAGINATION_DEMO_SEED_COUNT / pageSize));
}

export function normalizePaginationPageSize(value: unknown): PaginationDemoPageSize {
	const parsed =
		typeof value === "number"
			? value
			: typeof value === "string"
				? Number.parseInt(value, 10)
				: Number.NaN;

	return isPaginationDemoPageSize(parsed) ? parsed : PAGINATION_DEMO_PAGE_SIZE;
}

export function clampPaginationPageIndex(value: number, pageSize: number) {
	const totalPages = getPaginationDemoTotalPages(pageSize);
	return Math.min(Math.max(Math.floor(value), 0), totalPages - 1);
}

export function normalizePaginationPage(value: unknown, pageSize: number) {
	const parsed =
		typeof value === "number"
			? value
			: typeof value === "string"
				? Number.parseInt(value, 10)
				: Number.NaN;

	if (!Number.isFinite(parsed)) {
		return 0;
	}

	return clampPaginationPageIndex(parsed, pageSize);
}

export function normalizePagedPaginationSearch(
	search: Record<string, unknown>,
): PaginationPagedSearch {
	const pageSize = normalizePaginationPageSize(search.pageSize);

	return {
		page: normalizePaginationPage(search.page, pageSize),
		pageSize,
	};
}

export function normalizeInfinitePaginationSearch(
	search: Record<string, unknown>,
): PaginationInfiniteSearch {
	return {
		pageSize: normalizePaginationPageSize(search.pageSize),
	};
}

export function normalizePageJumpValue(value: string, totalPages: number) {
	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed)) {
		return 0;
	}

	return Math.min(Math.max(parsed - 1, 0), totalPages - 1);
}
