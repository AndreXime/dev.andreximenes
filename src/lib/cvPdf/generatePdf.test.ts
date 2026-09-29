import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseResumeMarkdown } from "../../tools/CVBuilder/lib/parserMd";
import { generatePdfFromHtml } from "./generatePdf";
import { renderResumeHtml } from "./renderHtml";

describe("generatePdfFromHtml", () => {
	it("gera PDF a partir do currículo de exemplo", async () => {
		const markdown = readFileSync(new URL("../../tools/CVBuilder/markdown/cvExample.md", import.meta.url), "utf8");
		const data = parseResumeMarkdown(markdown);
		const html = renderResumeHtml(data);
		const pdf = await generatePdfFromHtml(html);
		expect(pdf.byteLength).toBeGreaterThan(1_000);
		const header = new TextDecoder().decode(pdf.slice(0, 4));
		expect(header).toBe("%PDF");
	}, 60_000);
});
