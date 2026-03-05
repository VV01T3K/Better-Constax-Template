import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig({
	envDir: `${import.meta.dirname}/../..`,
	resolve: {
		alias: {
			"@": `${import.meta.dirname}/src`,
		},
	},
	plugins: [
		devtools(),
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
