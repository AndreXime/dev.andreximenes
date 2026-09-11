export const SUMMARY_MAX_LENGTH = 280;

export interface ParsedArticle {
	readonly id: string;
	readonly title: string;
	readonly link: string;
	readonly pubDate: number;
	readonly summary: string;
}

export interface ParsedFeed {
	readonly title: string;
	readonly description: string;
	readonly articles: readonly ParsedArticle[];
}

function decodeHtmlEntities(value: string): string {
	return value
		.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
		.replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">")
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'")
		.replace(/&apos;/gi, "'")
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&");
}

function stripHtml(html: string): string {
	let text = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");

	text = decodeHtmlEntities(text);

	for (let pass = 0; pass < 3; pass++) {
		const stripped = text.replace(/<[^>]+>/g, " ");
		if (stripped === text) break;
		text = stripped;
	}

	return text.replace(/\s+/g, " ").trim();
}

const BOILERPLATE_SUMMARY = /^(comments?|read more|continue reading|leia mais)$/i;

function normalizeChannelDescription(raw: string): string {
	return stripHtml(raw).trim();
}

function normalizeExcerpt(raw: string): string {
	if (raw.trim() === "") return "";

	const excerpt = stripHtml(raw).slice(0, SUMMARY_MAX_LENGTH);
	if (excerpt === "" || BOILERPLATE_SUMMARY.test(excerpt)) return "";
	return excerpt;
}

function pickExcerpt(block: string, summaryTags: readonly string[], bodyTags: readonly string[]): string {
	for (const tag of summaryTags) {
		const excerpt = normalizeExcerpt(readTagValue(block, tag));
		if (excerpt) return excerpt;
	}

	for (const tag of bodyTags) {
		const excerpt = normalizeExcerpt(readTagValue(block, tag));
		if (excerpt) return excerpt;
	}

	return "";
}

function decodeCdata(value: string): string {
	const cdata = value.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
	return cdata?.[1]?.trim() ?? value.trim();
}

function extractTagBlocks(xml: string, tag: string): string[] {
	const blocks: string[] = [];
	const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
	let match = regex.exec(xml);
	while (match) {
		const block = match[1];
		if (block) blocks.push(block);
		match = regex.exec(xml);
	}
	return blocks;
}

function readTagValue(block: string, tag: string): string {
	const selfClosing = new RegExp(`<${tag}[^>]*\\/\\s*>`, "i").exec(block);
	if (selfClosing) return "";

	const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i").exec(block);
	if (!match?.[1]) return "";
	return decodeCdata(match[1].replace(/\s+/g, " ").trim());
}

function readLinkHref(block: string): string {
	const alternate = /<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/i.exec(block);
	if (alternate?.[1]) return alternate[1];

	const hrefFirst = /<link[^>]+href=["']([^"']+)["']/i.exec(block);
	return hrefFirst?.[1] ?? "";
}

function parseDate(value: string): number {
	if (!value) return 0;
	const parsed = Date.parse(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

function articleId(link: string, title: string, pubDate: number): string {
	return `${pubDate}-${link || title}`.slice(0, 120);
}

function readChannelHeader(xml: string, kind: "rss" | "atom"): { title: string; description: string } {
	if (kind === "atom") {
		const headerEnd = xml.search(/<entry[\s>]/i);
		const header = headerEnd === -1 ? xml : xml.slice(0, headerEnd);
		return {
			title: readTagValue(header, "title") || "Feed Atom",
			description: normalizeChannelDescription(readTagValue(header, "subtitle")),
		};
	}

	const channelBlock = /<channel[^>]*>([\s\S]*?)<\/channel>/i.exec(xml)?.[1] ?? xml;
	const headerEnd = channelBlock.search(/<item[\s>]/i);
	const header = headerEnd === -1 ? channelBlock : channelBlock.slice(0, headerEnd);
	return {
		title: readTagValue(header, "title") || "Feed RSS",
		description: normalizeChannelDescription(readTagValue(header, "description")),
	};
}

function parseRss2(xml: string): ParsedFeed {
	const channel = readChannelHeader(xml, "rss");

	const articles = extractTagBlocks(xml, "item").map((item) => {
		const title = readTagValue(item, "title") || "Sem título";
		const link = readTagValue(item, "link") || readLinkHref(item);
		const pubDate = parseDate(readTagValue(item, "pubDate") || readTagValue(item, "dc:date"));
		const summary = pickExcerpt(item, ["description", "summary"], ["content:encoded", "content"]);

		return {
			id: articleId(link, title, pubDate),
			title,
			link,
			pubDate,
			summary,
		};
	});

	return { title: channel.title, description: channel.description, articles };
}

function parseAtom(xml: string): ParsedFeed {
	const channel = readChannelHeader(xml, "atom");

	const articles = extractTagBlocks(xml, "entry").map((entry) => {
		const title = readTagValue(entry, "title") || "Sem título";
		const link = readLinkHref(entry);
		const pubDate = parseDate(
			readTagValue(entry, "published") || readTagValue(entry, "updated") || readTagValue(entry, "modified"),
		);
		const summary = pickExcerpt(entry, ["summary", "description"], ["content"]);

		return {
			id: articleId(link, title, pubDate),
			title,
			link,
			pubDate,
			summary,
		};
	});

	return { title: channel.title, description: channel.description, articles };
}

export function parseFeedXml(xml: string): ParsedFeed {
	const normalized = xml.replace(/^\uFEFF/, "").trim();
	const isAtom = /<feed[\s>]/i.test(normalized);
	const parsed = isAtom ? parseAtom(normalized) : parseRss2(normalized);

	const articles = parsed.articles.filter((a) => a.title !== "" || a.link !== "").sort((a, b) => b.pubDate - a.pubDate);

	return { title: parsed.title, description: parsed.description, articles };
}
