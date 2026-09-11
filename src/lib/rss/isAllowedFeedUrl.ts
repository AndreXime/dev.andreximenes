import { lookup } from "node:dns/promises";

const BLOCKED_HOSTNAMES = new Set([
	"localhost",
	"metadata",
	"metadata.google.internal",
	"kubernetes.default",
	"kubernetes.default.svc",
]);

export function isIpv4Literal(host: string): boolean {
	const parts = host.split(".");
	if (parts.length !== 4) return false;
	return parts.every((part) => {
		if (!/^\d{1,3}$/.test(part)) return false;
		const n = Number(part);
		return n >= 0 && n <= 255;
	});
}

export function isPrivateOrLocalIp(ip: string): boolean {
	const normalized = ip.toLowerCase().replace(/^\[|\]$/g, "");

	if (normalized.includes(":")) {
		if (normalized === "::1") return true;
		if (normalized === "::") return true;
		if (normalized.startsWith("fe80:")) return true;
		if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
		if (normalized.startsWith("::ffff:")) {
			return isPrivateOrLocalIp(normalized.slice("::ffff:".length));
		}
		return false;
	}

	if (!isIpv4Literal(normalized)) return false;

	const [a = 0, b = 0] = normalized.split(".").map(Number);

	if (a === 0) return true;
	if (a === 10) return true;
	if (a === 127) return true;
	if (a === 169 && b === 254) return true;
	if (a === 172 && b >= 16 && b <= 31) return true;
	if (a === 192 && b === 168) return true;
	if (a === 100 && b >= 64 && b <= 127) return true;

	return false;
}

export function isBlockedHostname(hostname: string): boolean {
	const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");

	if (BLOCKED_HOSTNAMES.has(host)) return true;
	if (host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return true;
	if (isIpv4Literal(host) || host.includes(":")) return isPrivateOrLocalIp(host);

	return false;
}

/** Validacao sincrona de URL de feed (protocolo, porta, hostname e IP literal). */
export function parseFeedUrlCandidate(raw: string): URL | null {
	try {
		const url = new URL(raw.trim());
		if (url.protocol !== "https:") return null;
		if (url.username || url.password) return null;
		if (url.port && url.port !== "443") return null;
		if (isBlockedHostname(url.hostname)) return null;
		return url;
	} catch {
		return null;
	}
}

/** Resolve DNS e rejeita hosts que apontam para IPs privados ou locais. */
export async function isAllowedFeedUrl(raw: string): Promise<boolean> {
	const url = parseFeedUrlCandidate(raw);
	if (!url) return false;

	if (isIpv4Literal(url.hostname) || url.hostname.includes(":")) {
		return !isPrivateOrLocalIp(url.hostname);
	}

	try {
		const results = await lookup(url.hostname, { all: true, verbatim: true });
		if (results.length === 0) return false;
		return results.every((entry) => !isPrivateOrLocalIp(entry.address));
	} catch {
		return false;
	}
}
