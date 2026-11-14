import { describe, expect, it } from "vitest";
import { buildSearchHref } from "./listingSearch";

describe("buildSearchHref", () => {
	it("vai para /buscar sem query vazia", () => {
		expect(buildSearchHref("")).toBe("/buscar");
		expect(buildSearchHref("   ")).toBe("/buscar");
	});

	it("anexa q encoded", () => {
		expect(buildSearchHref("astro")).toBe("/buscar?q=astro");
		expect(buildSearchHref("a b")).toBe("/buscar?q=a+b");
	});
});
