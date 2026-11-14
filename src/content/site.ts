export const SITE_NAME = "dev.andreximenes";

export const SITE_TAGLINE = "Notas de um desenvolvedor · arquitetura web e ferramentas";

export const SITE_DESCRIPTION = "Notas técnicas, ferramentas web e links curados por André Ximenes.";

export function pageTitle(segment: string): string {
	return `${segment} · ${SITE_NAME}`;
}
