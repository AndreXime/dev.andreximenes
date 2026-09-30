// @ts-check

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://dev.andreximenes.xyz",
	output: "static",
	image: {
		remotePatterns: [{ protocol: "https" }],
	},
	build: {
		inlineStylesheets: "always",
	},

	vite: {
		plugins: [tailwindcss()],
		build: {
			// lightningcss ainda nao entende @theme do Tailwind v4 no passo de minify
			cssMinify: "esbuild",
		},
		ssr: {
			external: ["@sparticuz/chromium", "puppeteer-core"],
		},
	},

	integrations: [react(), sitemap()],
	adapter: vercel({
		maxDuration: 60,
		includeFiles: [
			"node_modules/@sparticuz/chromium/bin/al2023.tar.br",
			"node_modules/@sparticuz/chromium/bin/chromium.br",
			"node_modules/@sparticuz/chromium/bin/fonts.tar.br",
			"node_modules/@sparticuz/chromium/bin/swiftshader.tar.br",
		],
	}),
});
