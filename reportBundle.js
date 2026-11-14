import { promises as fs } from "node:fs";
import path from "node:path";

const distDir = new URL("./dist", import.meta.url).pathname;

async function collectHtmlFiles(dir, baseDir) {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const results = [];

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			results.push(...(await collectHtmlFiles(fullPath, baseDir)));
		} else if (entry.isFile() && entry.name.endsWith(".html")) {
			results.push(path.relative(baseDir, fullPath));
		}
	}

	return results;
}

function extractScriptSrcs(html) {
	const srcs = new Set();

	for (const match of html.matchAll(/<script[^>]+type=["']module["'][^>]+src=["']([^"']+\.js)["'][^>]*>/g)) {
		srcs.add(match[1]);
	}

	for (const match of html.matchAll(/<astro-island[^>]*>/g)) {
		const tag = match[0];

		for (const attr of ["component-url", "renderer-url"]) {
			const urlMatch = tag.match(new RegExp(`${attr}=["']([^"']+)["']`));
			if (urlMatch) srcs.add(urlMatch[1]);
		}
	}

	return [...srcs];
}

function resolveAstroFile(src) {
	const normalized = src.startsWith("/") ? src.slice(1) : src;
	if (!normalized.startsWith("_astro/")) return null;
	return path.join(distDir, normalized);
}

function extractChunkRefs(content) {
	const staticRefs = [...content.matchAll(/from["'](\.\/[^"']+\.js)["']/g)].map((match) => match[1]);
	const dynamicRefs = [...content.matchAll(/import\s*\([^)]*["'](\.\/[^"']+\.js)["']/g)].map((match) => match[1]);
	const absoluteRefs = [...content.matchAll(/["'](\/_astro\/[^"']+\.js)["']/g)].map((match) => match[1].slice(1));

	return { staticRefs, dynamicRefs, absoluteRefs };
}

async function collectChunkGraph(entryFiles) {
	const initial = new Map();
	const lazy = new Map();
	const staticQueue = [...entryFiles];
	const staticSeen = new Set();

	while (staticQueue.length > 0) {
		const file = staticQueue.shift();
		if (staticSeen.has(file)) continue;
		staticSeen.add(file);

		let content;
		try {
			content = await fs.readFile(file, "utf8");
		} catch {
			continue;
		}

		const stat = await fs.stat(file);
		initial.set(file, stat.size);

		const { staticRefs, absoluteRefs } = extractChunkRefs(content);
		const dir = path.dirname(file);

		for (const ref of staticRefs) {
			staticQueue.push(path.resolve(dir, ref));
		}

		for (const ref of absoluteRefs) {
			staticQueue.push(path.join(distDir, ref));
		}
	}

	const lazyQueue = [];
	const lazySeen = new Set();

	for (const file of staticSeen) {
		let content;
		try {
			content = await fs.readFile(file, "utf8");
		} catch {
			continue;
		}

		const { dynamicRefs } = extractChunkRefs(content);
		const dir = path.dirname(file);

		for (const ref of dynamicRefs) {
			lazyQueue.push(path.resolve(dir, ref));
		}
	}

	while (lazyQueue.length > 0) {
		const file = lazyQueue.shift();
		if (staticSeen.has(file) || lazySeen.has(file)) continue;
		lazySeen.add(file);

		let content;
		try {
			content = await fs.readFile(file, "utf8");
		} catch {
			continue;
		}

		const stat = await fs.stat(file);
		lazy.set(file, stat.size);

		const { staticRefs, dynamicRefs, absoluteRefs } = extractChunkRefs(content);
		const dir = path.dirname(file);

		for (const ref of staticRefs) {
			lazyQueue.push(path.resolve(dir, ref));
		}

		for (const ref of dynamicRefs) {
			lazyQueue.push(path.resolve(dir, ref));
		}

		for (const ref of absoluteRefs) {
			lazyQueue.push(path.join(distDir, ref));
		}
	}

	return { initial, lazy };
}

function humanKb(bytes) {
	return (bytes / 1024).toFixed(1);
}

function formatChunkList(chunks) {
	return [...chunks.entries()]
		.sort((a, b) => b[1] - a[1])
		.map(([file, size]) => ({
			src: `/_astro/${path.basename(file)}`,
			size,
		}));
}

const htmlFiles = await collectHtmlFiles(distDir, distDir);
const reports = [];

for (const relHtml of htmlFiles) {
	const fullHtmlPath = path.join(distDir, relHtml);
	const html = await fs.readFile(fullHtmlPath, "utf8");
	const srcs = extractScriptSrcs(html);
	const entryFiles = srcs.map(resolveAstroFile).filter((file) => file != null);

	const { initial, lazy } = await collectChunkGraph(entryFiles);
	const initialFiles = formatChunkList(initial);
	const lazyFiles = formatChunkList(lazy);
	const initialTotal = initialFiles.reduce((sum, file) => sum + file.size, 0);
	const lazyTotal = lazyFiles.reduce((sum, file) => sum + file.size, 0);

	reports.push({
		html: relHtml,
		initialTotal,
		lazyTotal,
		initialFiles,
		lazyFiles,
	});
}

reports.sort((a, b) => b.initialTotal + b.lazyTotal - (a.initialTotal + a.lazyTotal));

for (const { html, initialTotal, lazyTotal, initialFiles, lazyFiles } of reports) {
	if (initialTotal + lazyTotal === 0) continue;
	console.log(`\n${html}`);
	console.log(`  Initial JS: ${humanKb(initialTotal)} KB`);

	for (const { src, size } of initialFiles) {
		console.log(`    ${src} -> ${humanKb(size)} KB`);
	}

	if (lazyFiles.length > 0) {
		console.log(`  Lazy JS: ${humanKb(lazyTotal)} KB`);

		for (const { src, size } of lazyFiles) {
			console.log(`    ${src} -> ${humanKb(size)} KB`);
		}

		console.log(`  Total (initial + lazy): ${humanKb(initialTotal + lazyTotal)} KB`);
	}
}
