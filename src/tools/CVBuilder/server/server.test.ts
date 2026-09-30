import { describe, expect, it } from "vitest";
import { escapeHtml, richTextToHtml, safePdfFilename } from "./escapeHtml";
import { checkRateLimit, consumePdfGenerationSlots } from "./rateLimit";
import { renderResumeHtml } from "./renderHtml";

describe("escapeHtml", () => {
	it("escapa tags e aspas", () => {
		expect(escapeHtml(`<b a="x">'y'</b>`)).toBe("&lt;b a=&quot;x&quot;&gt;&#39;y&#39;&lt;/b&gt;");
	});

	it("converte markdown inline depois de escapar", () => {
		expect(richTextToHtml("**bold** e *itálico*")).toContain("<strong>bold</strong>");
		expect(richTextToHtml("<script>")).toBe("&lt;script&gt;");
	});

	it("gera nome de arquivo seguro", () => {
		expect(safePdfFilename("André Ximenes")).toBe("Andre-Ximenes");
		expect(safePdfFilename("")).toBe("curriculo");
	});
});

describe("checkRateLimit", () => {
	it("bloqueia após o limite da janela por IP", () => {
		const key = `test-${Math.random()}`;
		const start = 1_000_000;
		for (let i = 0; i < 8; i++) {
			expect(checkRateLimit(key, start + i).allowed).toBe(true);
		}
		const blocked = checkRateLimit(key, start + 9);
		expect(blocked.allowed).toBe(false);
		expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
	});
});

describe("consumePdfGenerationSlots", () => {
	it("bloqueia no teto global de 10 a cada 5 minutos", () => {
		const start = Date.now() + Math.floor(Math.random() * 1_000_000_000);
		for (let i = 0; i < 10; i++) {
			const result = consumePdfGenerationSlots(`global-ip-${i}-${start}`, start + i);
			expect(result.allowed).toBe(true);
		}
		const blocked = consumePdfGenerationSlots(`global-ip-extra-${start}`, start + 11);
		expect(blocked.allowed).toBe(false);
		expect(blocked.scope).toBe("global");
		expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
	});
});

describe("renderResumeHtml", () => {
	it("monta documento com seções principais", () => {
		const html = renderResumeHtml({
			header: {
				name: "Ana",
				role: "Dev",
				location: "SP",
				phone: "11",
				email: "ana@example.com",
				links: { portfolio: "https://ana.dev", linkedin: "", github: "" },
			},
			intro: "Texto **forte**",
			skills: ["TypeScript"],
			experience: [],
			projects: [],
			education: [],
		});

		expect(html).toContain("<h1>Ana</h1>");
		expect(html).toContain("Resumo Profissional");
		expect(html).toContain("<strong>forte</strong>");
		expect(html).toContain("Habilidades Técnicas");
	});
});
