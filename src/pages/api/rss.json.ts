import type { APIRoute } from "astro";
import { isAllowedFeedUrl } from "@/lib/rss/isAllowedFeedUrl";
import { parseFeedXml } from "@/lib/rss/rssFeedParser";

export const prerender = false;

const MAX_RESPONSE_BYTES = 2_000_000;
const FETCH_TIMEOUT_MS = 12_000;
const CACHE_OK_SECONDS = 600;
const CACHE_PERMANENT_ERROR_SECONDS = 600;
const CACHE_TRANSIENT_ERROR_SECONDS = 120;

// A CDN da Vercel so cacheia GET com status 200, 404, 410 e redirects (ver docs/caching/cdn-cache).
// Erros reais (400, 422, 502 etc.) nao entram no cache edge, mesmo com s-maxage.
// Workaround: responder 404/410 com { error } no JSON. O cliente le a mensagem do corpo, nao do status HTTP.
// Erros permanentes (URL invalida, feed inexistente) usam cache longo; falhas transitórias (timeout, 5xx) usam cache curto.

function jsonResponse(body: unknown, status: number, cacheSeconds: number): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`,
		},
	});
}

export const GET: APIRoute = async ({ request }) => {
	const feedUrl = new URL(request.url).searchParams.get("url")?.trim();

	if (!feedUrl || !(await isAllowedFeedUrl(feedUrl))) {
		return jsonResponse({ error: "URL de feed invalida." }, 404, CACHE_PERMANENT_ERROR_SECONDS);
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

	try {
		const response = await fetch(feedUrl, {
			signal: controller.signal,
			headers: {
				Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
				"User-Agent": "dev.andreximenes RSS Reader/1.0",
			},
			redirect: "manual",
		});

		if (response.status >= 300 && response.status < 400) {
			return jsonResponse({ error: "Redirects de feed nao sao permitidos." }, 404, CACHE_PERMANENT_ERROR_SECONDS);
		}

		if (!response.ok) {
			const isPermanent = response.status === 404 || response.status === 410;
			const cacheSeconds = isPermanent ? CACHE_PERMANENT_ERROR_SECONDS : CACHE_TRANSIENT_ERROR_SECONDS;
			const status = response.status === 410 ? 410 : 404;
			return jsonResponse({ error: `Feed retornou status ${response.status}.` }, status, cacheSeconds);
		}

		const contentType = response.headers.get("content-type") ?? "";
		if (contentType.includes("text/html")) {
			return jsonResponse({ error: "A URL nao parece ser um feed RSS/Atom." }, 404, CACHE_PERMANENT_ERROR_SECONDS);
		}

		const xml = await response.text();
		if (xml.length > MAX_RESPONSE_BYTES) {
			return jsonResponse({ error: "Feed muito grande para processar." }, 404, CACHE_PERMANENT_ERROR_SECONDS);
		}

		const parsed = parseFeedXml(xml);

		return jsonResponse(
			{
				title: parsed.title,
				description: parsed.description,
				articles: parsed.articles,
			},
			200,
			CACHE_OK_SECONDS,
		);
	} catch (error) {
		const message =
			error instanceof Error && error.name === "AbortError"
				? "Tempo esgotado ao buscar o feed."
				: "Nao foi possivel buscar o feed.";
		return jsonResponse({ error: message }, 404, CACHE_TRANSIENT_ERROR_SECONDS);
	} finally {
		clearTimeout(timeout);
	}
};
