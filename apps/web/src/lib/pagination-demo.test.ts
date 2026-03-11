import { PAGINATION_DEMO_PAGE_SIZE } from "@repo/convex/schemas/pagination-demo.constants";
import { describe, expect, it } from "vitest";

import {
	clampPaginationPageIndex,
	getPaginationDemoTotalPages,
	normalizeInfinitePaginationSearch,
	normalizePagedPaginationSearch,
	normalizePageJumpValue,
} from "./pagination-demo";

describe("pagination demo paged search normalization", () => {
	it("defaults to the first page with the default page size", () => {
		expect(normalizePagedPaginationSearch({})).toEqual({
			page: 0,
			pageSize: PAGINATION_DEMO_PAGE_SIZE,
		});
	});

	it("parses and clamps shared paged URLs", () => {
		expect(normalizePagedPaginationSearch({ page: "999", pageSize: "1000" })).toEqual({
			page: getPaginationDemoTotalPages(1000) - 1,
			pageSize: 1000,
		});
	});
});

describe("pagination demo infinite search normalization", () => {
	it("keeps only the shared page-size state", () => {
		expect(normalizeInfinitePaginationSearch({ page: "8", pageSize: "500" })).toEqual({
			pageSize: 500,
		});
	});
});

describe("pagination demo page helpers", () => {
	it("clamps page indices against the seeded row count", () => {
		expect(clampPaginationPageIndex(999, 2000)).toBe(4);
	});

	it("normalizes numeric page jump input", () => {
		expect(normalizePageJumpValue("12", 8)).toBe(7);
		expect(normalizePageJumpValue("0", 8)).toBe(0);
		expect(normalizePageJumpValue("abc", 8)).toBe(0);
	});
});
