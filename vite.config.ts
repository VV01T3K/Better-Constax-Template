import type { NitroConfig } from "nitro/types";

import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

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
		nitro({
			preset: process.env.NITRO_PRESET
				? (process.env.NITRO_PRESET as NitroConfig["preset"])
				: "bun",
		}),
		tailwindcss(),
		tanstackStart(),
		viteReact({
			babel: {
				plugins: ["babel-plugin-react-compiler"],
			},
		}),
		VitePWA({
			injectRegister: false,
			manifest: {
				short_name: "TanStack App",
				name: "TanStack Start Starter",
				description:
					"A modern full-stack application built with TanStack Start, React 19, and Convex",
				icons: [
					{
						src: "favicon.ico",
						sizes: "64x64 32x32 24x24 16x16",
						type: "image/x-icon",
					},
					{
						src: "logo192.png",
						type: "image/png",
						sizes: "192x192",
						purpose: "any maskable",
					},
					{
						src: "logo512.png",
						type: "image/png",
						sizes: "512x512",
						purpose: "any maskable",
					},
				],
				start_url: "/",
				scope: "/",
				display: "standalone",
				orientation: "portrait-primary",
				theme_color: "#000000",
				background_color: "#ffffff",
				categories: ["productivity", "utilities"],
			},
		}),
	],
});

export default config;
