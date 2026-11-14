import type { Post } from "@/content.config";

export interface PostMeta {
	kind: "tool" | "note" | "link";
	typeLabel: string;
	href: string;
	external: boolean;
}

export function getPostUrl(post: Post): string {
	switch (post.type) {
		case "note":
			return `/post/${post.slug}`;
		case "tool":
			return `/app/${post.slug}`;
		case "link":
			return post.target ?? "#";
	}
}

export function getPostMeta(post: Post): PostMeta {
	const href = getPostUrl(post);

	switch (post.type) {
		case "tool":
			return {
				kind: "tool",
				typeLabel: "Ferramenta",
				href,
				external: false,
			};
		case "note":
			return {
				kind: "note",
				typeLabel: "Nota",
				href,
				external: false,
			};
		case "link":
			return {
				kind: "link",
				typeLabel: "Link",
				href,
				external: true,
			};
	}
}
