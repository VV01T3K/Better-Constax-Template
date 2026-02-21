import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const srcPath = fileURLToPath(new URL("./src", import.meta.url));
const convexPath = fileURLToPath(new URL("./convex", import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			"@": srcPath,
			"@convex": convexPath,
		},
	},
	test: {
		environment: "node",
	},
});
