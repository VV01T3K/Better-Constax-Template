import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		globals: true,
		passWithNoTests: true,
		isolate: false,
		pool: "threads",
		testTimeout: 5000,
		coverage: {
			provider: "v8",
			include: ["src/**/*.{ts,tsx}"],
			exclude: ["src/routeTree.gen.ts", "src/**/*.test.{ts,tsx}"],
			reporter: ["text", "html"],
		},
		projects: [
			{
				test: {
					name: "unit",
					environment: "happy-dom",
					include: ["src/**/*.test.{ts,tsx}"],
					exclude: ["src/**/*.browser.test.{ts,tsx}"],
				},
			},
			{
				test: {
					name: "browser",
					browser: {
						enabled: true,
						provider: playwright(),
						headless: true,
						instances: [{ browser: "chromium" }],
					},
					include: ["src/**/*.browser.test.{ts,tsx}"],
				},
			},
		],
	},
});
