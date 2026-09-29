import type { APIRoute } from "astro";
import { safePdfFilename } from "@/lib/cvPdf/escapeHtml";
import { generatePdfFromHtml, isPdfGenerationBusy } from "@/lib/cvPdf/generatePdf";
import { clientIpFromRequest, consumePdfGenerationSlots } from "@/lib/cvPdf/rateLimit";
import { renderResumeHtml } from "@/lib/cvPdf/renderHtml";
import { parseResumeMarkdown } from "@/tools/CVBuilder/lib/parserMd";

export const prerender = false;

const MAX_MARKDOWN_CHARS = 80_000;

function jsonError(message: string, status: number, extraHeaders: HeadersInit = {}): Response {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: {
			"Content-Type": "application/json",
			...extraHeaders,
		},
	});
}

export const POST: APIRoute = async ({ request }) => {
	if (request.headers.get("content-type")?.includes("application/json") !== true) {
		return jsonError("Content-Type deve ser application/json.", 415);
	}

	const ip = clientIpFromRequest(request);
	const limit = consumePdfGenerationSlots(ip);
	if (!limit.allowed) {
		const message =
			limit.scope === "global"
				? "Limite global de geração atingido. Tente novamente em alguns minutos."
				: "Muitas solicitações. Tente novamente em alguns minutos.";
		return jsonError(message, 429, {
			"Retry-After": String(limit.retryAfterSeconds),
		});
	}

	if (isPdfGenerationBusy()) {
		return jsonError("Geração de PDF em andamento. Tente de novo em instantes.", 503, {
			"Retry-After": "5",
		});
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return jsonError("JSON inválido.", 400);
	}

	const markdown =
		typeof body === "object" && body !== null && "markdown" in body && typeof body.markdown === "string"
			? body.markdown
			: null;

	if (!markdown || markdown.trim() === "") {
		return jsonError("Campo markdown é obrigatório.", 400);
	}

	if (markdown.length > MAX_MARKDOWN_CHARS) {
		return jsonError("Markdown excede o tamanho máximo permitido.", 413);
	}

	try {
		const data = parseResumeMarkdown(markdown);
		const html = renderResumeHtml(data);
		const pdf = await generatePdfFromHtml(html);
		const nome = data.header.name.trim() || "Curriculo";
		const role = data.header.role.trim();
		const base = role ? `${safePdfFilename(nome)}-${safePdfFilename(role)}` : safePdfFilename(nome);
		const filename = `${base}.pdf`;

		return new Response(Buffer.from(pdf), {
			status: 200,
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename="${filename}"`,
				"Cache-Control": "no-store",
				"X-RateLimit-Remaining": String(limit.remaining),
			},
		});
	} catch (error) {
		if (error instanceof Error && error.message === "BUSY") {
			return jsonError("Geração de PDF em andamento. Tente de novo em instantes.", 503, {
				"Retry-After": "5",
			});
		}
		console.error("[cv-pdf]", error);
		return jsonError("Falha ao gerar o PDF.", 500);
	}
};
