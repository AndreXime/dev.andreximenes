export type SectionCategory = "all" | "tool" | "note" | "link" | "author";
export type ContentKind = "note" | "tool" | "link";

export interface SectionDefinition {
	category: SectionCategory;
	href: string;
	navLabel: string;
	title: string;
	description: string;
	kind?: ContentKind;
}

export const SECTIONS: SectionDefinition[] = [
	{
		category: "all",
		href: "/",
		navLabel: "Início",
		title: "Início",
		description: "Visão geral e publicações recentes",
	},
	{
		category: "note",
		href: "/post",
		navLabel: "Notas",
		title: "Notas",
		description: "Artigos técnicos e rascunhos longos",
		kind: "note",
	},
	{
		category: "tool",
		href: "/app",
		navLabel: "Ferramentas",
		title: "Ferramentas",
		description: "Apps web que mantenho e uso",
		kind: "tool",
	},
	{
		category: "link",
		href: "/link",
		navLabel: "Links",
		title: "Links",
		description: "Referências salvas e recomendações",
		kind: "link",
	},
	{
		category: "author",
		href: "/autor",
		navLabel: "Autor",
		title: "Sobre o autor",
		description: "Quem escreve este hub e onde me encontrar",
	},
];

export const NAV_SECTIONS = SECTIONS.filter((section) => section.category !== "all");

export function getListingTitle(activeCategory: string): string {
	if (activeCategory === "all") return "Publicações recentes";
	return SECTIONS.find((section) => section.category === activeCategory)?.title ?? activeCategory;
}

export function getSectionDescription(activeCategory: SectionCategory): string | undefined {
	return SECTIONS.find((section) => section.category === activeCategory)?.description;
}
