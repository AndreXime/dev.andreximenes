import { describe, expect, it } from "vitest";
import type { Post } from "@/content.config";
import { resolveFeaturedTool } from "./homeFeatured";

const cover = {
	src: "/_astro/x.webp",
	width: 1200,
	height: 750,
	format: "webp" as const,
};

function tool(slug: string, title = slug): Post {
	return {
		slug,
		type: "tool",
		title,
		date: new Date("2026-01-01"),
		description: "desc",
		cover,
	};
}

describe("resolveFeaturedTool", () => {
	it("retorna o tool cujo slug bate", () => {
		const posts = [
			tool("goal-quest"),
			tool("criador-de-curriculos", "Criador de currículos"),
		];
		const found = resolveFeaturedTool(posts, "criador-de-curriculos");
		expect(found?.title).toBe("Criador de currículos");
	});

	it("retorna null se o slug não existir", () => {
		expect(resolveFeaturedTool([tool("goal-quest")], "sumido")).toBeNull();
	});

	it("retorna null se o slug existir mas não for tool", () => {
		const note: Post = {
			slug: "uma-nota",
			type: "note",
			title: "Nota",
			date: new Date("2026-01-01"),
			cover,
		};
		expect(resolveFeaturedTool([note], "uma-nota")).toBeNull();
	});
});
