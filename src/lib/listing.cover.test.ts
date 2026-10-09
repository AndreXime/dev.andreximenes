import { describe, expect, it } from "vitest";
import type { Post } from "@/content.config";

describe("Post cover typing", () => {
	it("Post aceita cover ImageMetadata-like", () => {
		const cover = {
			src: "/_astro/x.webp",
			width: 1200,
			height: 750,
			format: "webp" as const,
		};
		const post: Post = {
			slug: "goal-quest",
			type: "tool",
			title: "Goal Quest",
			date: new Date("2026-09-23"),
			cover,
		};
		expect(post.cover?.width).toBe(1200);
	});
});
