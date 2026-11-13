import type { Post } from "@/content.config";

export function resolveFeaturedTool(posts: Post[], slug: string): Post | null {
	const match = posts.find((post) => post.slug === slug);
	if (!match || match.type !== "tool") return null;
	return match;
}
