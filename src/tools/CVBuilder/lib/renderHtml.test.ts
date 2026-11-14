import { describe, expect, it } from "vitest";
import { escapeHtml, richTextToHtml } from "./escapeHtml";
import { renderResumeHtml } from "./renderHtml";

describe("escapeHtml", () => {
	it("escapa tags e aspas", () => {
		expect(escapeHtml(`<b a="x">'y'</b>`)).toBe("&lt;b a=&quot;x&quot;&gt;&#39;y&#39;&lt;/b&gt;");
	});

	it("converte markdown inline depois de escapar", () => {
		expect(richTextToHtml("**bold** e *itálico*")).toContain("<strong>bold</strong>");
		expect(richTextToHtml("<script>")).toBe("&lt;script&gt;");
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

		expect(html).toContain("<title>Ana - Dev</title>");
		expect(html).toContain("<h1>Ana</h1>");
		expect(html).toContain("Resumo Profissional");
		expect(html).toContain("<strong>forte</strong>");
		expect(html).toContain("Habilidades Técnicas");
	});
});
