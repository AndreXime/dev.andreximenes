import { getCollection } from "astro:content";
import type { Post } from "@/content.config";

export async function loadPosts(type?: Post["type"]): Promise<Post[]> {
	const entries = await getCollection("posts");

	const posts = entries.map((entry) => ({
		...entry.data,
		content: entry.body,
	}));

	const featured = posts.filter((post) => post.featured);
	if (featured.length > 1) {
		throw new Error(`Mais de um post em destaque: ${featured.map((post) => post.slug).join(", ")}`);
	}

	return posts.filter((post) => (type ? post.type === type : true)).sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function excerptFromContent(content: string | undefined): string | null {
	if (!content) return null;

	const plain = content
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/!\[[^\]]*\]\([^)]*\)/g, "")
		.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
		.replace(/^#{1,6}\s+/gm, "")
		.replace(/[*_~`>#]/g, "")
		.replace(/\s+/g, " ")
		.trim();

	return plain.length > 0 ? plain : null;
}

export function listingDescription(post: Post): string | null {
	const fromFrontmatter = post.description?.trim();
	if (fromFrontmatter) return fromFrontmatter;
	return excerptFromContent(post.content);
}

export function formatDate(date: Date): string {
	return date.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}
