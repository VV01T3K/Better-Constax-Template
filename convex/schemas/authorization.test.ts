import { describe, expect, it } from "vitest";

import { normalizePermissionList, normalizeRole } from "./authorization";

describe("authorization schema normalization", () => {
	it("keeps valid role values", () => {
		expect(normalizeRole("admin")).toBe("admin");
	});

	it("rejects case-variant role values", () => {
		expect(normalizeRole("Admin")).toBe("user");
	});

	it("rejects comma-separated role values", () => {
		expect(normalizeRole("admin,manager")).toBe("user");
	});

	it("defaults to user for missing role values", () => {
		expect(normalizeRole(undefined)).toBe("user");
	});

	it("deduplicates valid permission values", () => {
		expect(normalizePermissionList(["demo.todos.access", "demo.todos.access"])).toEqual([
			"demo.todos.access",
		]);
	});

	it("drops legacy permission aliases", () => {
		expect(normalizePermissionList(["demo.todos.manage"])).toEqual([]);
	});

	it("drops invalid permission values", () => {
		expect(normalizePermissionList(["not.real.permission"])).toEqual([]);
	});
});
