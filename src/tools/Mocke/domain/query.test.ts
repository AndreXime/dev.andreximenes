import { describe, expect, it } from "vitest";
import { queryDataset } from "./query";
import type { DataRecord } from "./types";

const fields = ["id", "title", "category", "price", "tags"] as const;

const sample: DataRecord[] = [
	{ id: "1", title: "Alpha Shoes", category: "shoes", price: "10", tags: "sale|new" },
	{ id: "2", title: "Beta Hat", category: "hats", price: "30", tags: "new" },
	{ id: "3", title: "Gamma Shoes", category: "shoes", price: "20", tags: "sale" },
	{ id: "4", title: "Delta Belt", category: "belts", price: "15", tags: "classic,leather" },
];

describe("queryDataset", () => {
	it("filtra por igualdade simples", () => {
		const rows = queryDataset(sample, fields, { filters: { category: "shoes" } });
		expect(rows.map((r) => r.id)).toEqual(["1", "3"]);
	});

	it("OR por vírgula no valor do filtro", () => {
		const rows = queryDataset(sample, fields, { filters: { category: "hats,belts" } });
		expect(rows.map((r) => r.id).sort()).toEqual(["2", "4"]);
	});

	it("bate valor dentro de lista separada por | ou ,", () => {
		const byPipe = queryDataset(sample, fields, { filters: { tags: "sale" } });
		expect(byPipe.map((r) => r.id).sort()).toEqual(["1", "3"]);
		const byComma = queryDataset(sample, fields, { filters: { tags: "leather" } });
		expect(byComma.map((r) => r.id)).toEqual(["4"]);
	});

	it("busca q case-insensitive em todos os campos", () => {
		const rows = queryDataset(sample, fields, { q: "shoes" });
		expect(rows.map((r) => r.id).sort()).toEqual(["1", "3"]);
	});

	it("restringe busca com searchFields", () => {
		const rows = queryDataset(sample, fields, { q: "shoes", searchFields: ["title"] });
		expect(rows.map((r) => r.id).sort()).toEqual(["1", "3"]);
		const none = queryDataset(sample, fields, { q: "shoes", searchFields: ["price"] });
		expect(none).toEqual([]);
	});

	it("ordena asc/desc por campo", () => {
		const asc = queryDataset(sample, fields, {
			filters: { category: "shoes" },
			sort: "price",
			order: "asc",
		});
		expect(asc.map((r) => r.id)).toEqual(["1", "3"]);
		const desc = queryDataset(sample, fields, {
			filters: { category: "shoes" },
			sort: "price",
			order: "desc",
		});
		expect(desc.map((r) => r.id)).toEqual(["3", "1"]);
	});

	it("projeta fields e ignora nomes inválidos", () => {
		const rows = queryDataset(sample, fields, { fields: ["id", "title", "nope"], limit: 1 });
		expect(rows).toEqual([{ id: "1", title: "Alpha Shoes" }]);
	});

	it("fields só inválidos devolve registro completo", () => {
		const rows = queryDataset(sample, fields, { fields: ["nope"], limit: 1 });
		expect(rows[0]).toEqual(sample[0]);
	});

	it("fields vazio devolve objetos vazios", () => {
		const rows = queryDataset(sample, fields, { fields: [], limit: 1 });
		expect(rows).toEqual([{}]);
	});

	it("aplica limit com default 20 e clamp", () => {
		const many = Array.from({ length: 25 }, (_, i) => ({
			id: String(i),
			title: `t${i}`,
			category: "x",
			price: "1",
			tags: "",
		}));
		expect(queryDataset(many, fields, {}).length).toBe(20);
		expect(queryDataset(many, fields, { limit: 0 }).length).toBe(20);
		expect(queryDataset(many, fields, { limit: 3 }).length).toBe(3);
		expect(queryDataset(many, fields, { limit: 999 }).length).toBe(25);
	});

	it("ignora filtro/sort em campo desconhecido", () => {
		const rows = queryDataset(sample, fields, {
			filters: { ghost: "1" },
			sort: "ghost",
			order: "desc",
		});
		expect(rows.map((r) => r.id)).toEqual(["1", "2", "3", "4"]);
	});
});
