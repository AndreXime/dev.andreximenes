import { describe, expect, it } from "vitest";
import { recordsToCsv } from "./csv";

describe("recordsToCsv", () => {
	it("gera header e linhas", () => {
		const csv = recordsToCsv([
			{ id: "1", title: "Alpha" },
			{ id: "2", title: "Beta" },
		]);
		expect(csv).toBe("id,title\n1,Alpha\n2,Beta");
	});

	it("escapa aspas, vírgulas e quebras de linha", () => {
		const csv = recordsToCsv([{ id: "1", title: 'He said "oi",\nok' }]);
		expect(csv).toBe('id,title\n1,"He said ""oi"",\nok"');
	});

	it("array vazio vira string vazia", () => {
		expect(recordsToCsv([])).toBe("");
	});
});
