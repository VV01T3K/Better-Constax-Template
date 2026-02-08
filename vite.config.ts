import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig({
	resolve: {
		alias: {
			"@": import.meta.dirname + "/src",
		},
	},
	ssr: {
		noExternal: ["@convex-dev/better-auth"],
	},
	plugins: [
		devtools(),
		nitro({ preset: "bun" }),
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
