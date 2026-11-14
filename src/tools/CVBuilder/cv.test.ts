import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { escapeHtml, richTextToHtml } from "./lib/escapeHtml";
import { parseResumeMarkdown } from "./lib/parserMd";
import { renderResumeHtml } from "./lib/renderHtml";

const exampleMarkdown = readFileSync(new URL("./markdown/cvExample.md", import.meta.url), "utf8");

describe("escapeHtml", () => {
	it("escapa tags e aspas", () => {
		expect(escapeHtml(`<b a="x">'y'</b>`)).toBe("&lt;b a=&quot;x&quot;&gt;&#39;y&#39;&lt;/b&gt;");
	});
});

describe("richTextToHtml", () => {
	it("converte markdown inline depois de escapar", () => {
		expect(richTextToHtml("**bold** e *itálico*")).toBe("<strong>bold</strong> e <em>itálico</em>");
		expect(richTextToHtml("<script>")).toBe("&lt;script&gt;");
		expect(richTextToHtml("**<script>**")).toBe("<strong>&lt;script&gt;</strong>");
	});
});

describe("renderResumeHtml", () => {
	it("gera documento imprimível a partir do currículo de exemplo", () => {
		const data = parseResumeMarkdown(exampleMarkdown);
		const html = renderResumeHtml(data);

		expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
		expect(html).toContain('lang="pt-BR"');
		expect(html).toContain("<title>Seu nome - [Título Adaptado à Vaga]</title>");
		expect(html).toContain('class="a4-page"');
		expect(html).toContain("Resumo Profissional");
		expect(html).toContain("Experiência Profissional");
		expect(html).toContain("Projetos Relevantes");
		expect(html).toContain("Habilidades Técnicas");
		expect(html).toContain("Formação Acadêmica");
		expect(html).toContain("<strong>[Tech]</strong>");
	});

	it("escapa conteúdo inseguro no título e no corpo", () => {
		const html = renderResumeHtml({
			header: {
				name: `<script>alert(1)</script>`,
				role: `Dev "Senior"`,
				location: "",
				phone: "",
				email: "",
				links: { portfolio: "", linkedin: "", github: "" },
			},
			intro: "Olá <b>mundo</b>",
			skills: [],
			experience: [],
			projects: [],
			education: [],
		});

		expect(html).toContain("<title>&lt;script&gt;alert(1)&lt;/script&gt; - Dev &quot;Senior&quot;</title>");
		expect(html).not.toContain("<script>alert(1)</script>");
		expect(html).toContain("Olá &lt;b&gt;mundo&lt;/b&gt;");
	});
});
