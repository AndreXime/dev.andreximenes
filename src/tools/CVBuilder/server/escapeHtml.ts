export function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

export function richTextToHtml(content: string): string {
	const escaped = escapeHtml(content);
	return escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>");
}

export function removeHttps(url: string): string {
	return url.replace(/^https?:\/\//, "");
}

export function safePdfFilename(name: string): string {
	const cleaned = name
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^\w\s.-]/g, "")
		.trim()
		.replace(/\s+/g, "-")
		.slice(0, 80);
	return cleaned || "curriculo";
}
