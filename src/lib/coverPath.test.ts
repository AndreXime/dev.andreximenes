import { describe, expect, it } from "vitest";
import { coverAssetPath, coverFrontmatterPath } from "./coverPath";

describe("coverPath", () => {
	it("monta path do asset no repo", () => {
		expect(coverAssetPath("tool", "goal-quest")).toBe(
			"src/assets/covers/tools/goal-quest.webp",
		);
		expect(
			coverAssetPath("note", "astro-vs-nextjs-o-custo-da-preguica-no-vibe-coding"),
		).toBe(
			"src/assets/covers/notes/astro-vs-nextjs-o-custo-da-preguica-no-vibe-coding.webp",
		);
		expect(coverAssetPath("link", "gerador-de-favicon")).toBe(
			"src/assets/covers/links/gerador-de-favicon.webp",
		);
	});

	it("monta path relativo do MD (tools/notes/links) até o asset", () => {
		expect(coverFrontmatterPath("tool", "goal-quest")).toBe(
			"../../../assets/covers/tools/goal-quest.webp",
		);
		expect(
			coverFrontmatterPath("note", "ssr-completo-ou-skeleton-decida-pelo-dado"),
		).toBe(
			"../../../assets/covers/notes/ssr-completo-ou-skeleton-decida-pelo-dado.webp",
		);
		expect(coverFrontmatterPath("link", "imagem-para-svg")).toBe(
			"../../../assets/covers/links/imagem-para-svg.webp",
		);
	});
});
