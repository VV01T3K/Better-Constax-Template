import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";
const config = defineConfig({
	resolve: {
		alias: {
			"@convex": `${import.meta.dirname}/convex/shared`,
			"@": `${import.meta.dirname}/src`,
		},
	},
	plugins: [
		devtools(),
		devtoolsJson({ normalizeForWindowsContainer: true }),
		nitro({ rolldownConfig: { external: ["bun", /^@sentry\//] }, preset: "bun" }),
		tailwindcss(),
		tanstackStart(),
		viteReact({
			babel: {
				plugins: ["babel-plugin-react-compiler"],
			},
		}),
	],
});

export default config;
