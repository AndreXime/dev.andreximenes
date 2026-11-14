import { describe, expect, it } from "vitest";
import { buildSearchHref, isSearchPagePath } from "./listingSearch";

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

describe("isSearchPagePath", () => {
	it("reconhece /buscar com ou sem barra final", () => {
		expect(isSearchPagePath("/buscar")).toBe(true);
		expect(isSearchPagePath("/buscar/")).toBe(true);
	});

	it("rejeita outras rotas", () => {
		expect(isSearchPagePath("/")).toBe(false);
		expect(isSearchPagePath("/post")).toBe(false);
	});
});
