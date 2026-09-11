import { describe, expect, it } from "vitest";
import { isBlockedHostname, isPrivateOrLocalIp, parseFeedUrlCandidate } from "./isAllowedFeedUrl";

describe("isPrivateOrLocalIp", () => {
	it("bloqueia IPv4 privados e especiais", () => {
		expect(isPrivateOrLocalIp("127.0.0.1")).toBe(true);
		expect(isPrivateOrLocalIp("10.0.0.1")).toBe(true);
		expect(isPrivateOrLocalIp("172.16.5.1")).toBe(true);
		expect(isPrivateOrLocalIp("192.168.1.1")).toBe(true);
		expect(isPrivateOrLocalIp("169.254.169.254")).toBe(true);
		expect(isPrivateOrLocalIp("0.0.0.0")).toBe(true);
		expect(isPrivateOrLocalIp("100.64.0.1")).toBe(true);
	});

	it("permite IPv4 publicos", () => {
		expect(isPrivateOrLocalIp("8.8.8.8")).toBe(false);
		expect(isPrivateOrLocalIp("1.1.1.1")).toBe(false);
	});

	it("bloqueia IPv6 locais e link-local", () => {
		expect(isPrivateOrLocalIp("::1")).toBe(true);
		expect(isPrivateOrLocalIp("fe80::1")).toBe(true);
		expect(isPrivateOrLocalIp("fc00::1")).toBe(true);
		expect(isPrivateOrLocalIp("fd12::1")).toBe(true);
		expect(isPrivateOrLocalIp("::ffff:127.0.0.1")).toBe(true);
	});
});

describe("isBlockedHostname", () => {
	it("bloqueia localhost e sufixos locais", () => {
		expect(isBlockedHostname("localhost")).toBe(true);
		expect(isBlockedHostname("app.localhost")).toBe(true);
		expect(isBlockedHostname("printer.local")).toBe(true);
		expect(isBlockedHostname("svc.internal")).toBe(true);
		expect(isBlockedHostname("metadata.google.internal")).toBe(true);
	});

	it("permite hostnames publicos", () => {
		expect(isBlockedHostname("feeds.bbci.co.uk")).toBe(false);
		expect(isBlockedHostname("example.com")).toBe(false);
	});
});

describe("parseFeedUrlCandidate", () => {
	it("exige https sem credenciais e porta padrao", () => {
		expect(parseFeedUrlCandidate("http://example.com/feed")?.href).toBeUndefined();
		expect(parseFeedUrlCandidate("https://user:pass@example.com/feed")?.href).toBeUndefined();
		expect(parseFeedUrlCandidate("https://example.com:8443/feed")?.href).toBeUndefined();
		expect(parseFeedUrlCandidate("ftp://example.com/feed")?.href).toBeUndefined();
	});

	it("rejeita IPs privados literais", () => {
		expect(parseFeedUrlCandidate("https://127.0.0.1/feed")).toBeNull();
		expect(parseFeedUrlCandidate("https://169.254.169.254/latest")).toBeNull();
		expect(parseFeedUrlCandidate("https://192.168.0.10/rss.xml")).toBeNull();
	});

	it("aceita feeds https publicos", () => {
		expect(parseFeedUrlCandidate("https://example.com/rss.xml")?.hostname).toBe("example.com");
		expect(parseFeedUrlCandidate(" https://feeds.bbci.co.uk/news/rss.xml ")?.hostname).toBe("feeds.bbci.co.uk");
	});
});
