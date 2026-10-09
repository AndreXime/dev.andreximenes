export type CoverPostType = "tool" | "note" | "link";

const FOLDER: Record<CoverPostType, string> = {
	tool: "tools",
	note: "notes",
	link: "links",
};

export function coverAssetPath(type: CoverPostType, slug: string): string {
	return `src/assets/covers/${FOLDER[type]}/${slug}.webp`;
}

/** Path relativo a partir de src/content/posts/<tools|notes|links>/<slug>.md */
export function coverFrontmatterPath(type: CoverPostType, slug: string): string {
	return `../../../assets/covers/${FOLDER[type]}/${slug}.webp`;
}
