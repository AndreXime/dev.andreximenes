import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

export interface Post {
	slug: string;
	type: "tool" | "note" | "link";
	title: string;
	date: Date;
	description?: string | undefined;
	content?: string | undefined;
	target?: string | undefined;
}

const posts = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
	schema: z.object({
		title: z.string(),
		slug: z.string(),
		type: z.enum(["tool", "note", "link"]),
		date: z.coerce.date(),
		description: z.string().optional(),
		target: z.string().optional(),
	}),
});

export const collections = { posts };
